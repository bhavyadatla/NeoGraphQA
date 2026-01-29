import bcrypt from "bcryptjs";
import crypto from "crypto";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { db } from "../../db";
import { users, otpCodes } from "@shared/models/auth";
import { eq, and, gt } from "drizzle-orm";
import nodemailer from "nodemailer";

// Email transporter (will use env vars)
const getEmailTransporter = () => {
  // For development, use a test account or console logging
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "neographqa-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Generate 6-digit OTP
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP email
async function sendOTPEmail(email: string, otp: string, type: string) {
  const transporter = getEmailTransporter();
  
  const subject = type === "signup" 
    ? "Verify your NeoGraphQA account" 
    : type === "login"
    ? "Your NeoGraphQA login code"
    : "Reset your NeoGraphQA password";
    
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #3b82f6;">NeoGraphQA</h2>
      <p>Your verification code is:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">${otp}</span>
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p style="color: #6b7280; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@neographqa.com",
      to: email,
      subject,
      html,
    });
  } else {
    // Log to console for development
    console.log(`\n========================================`);
    console.log(`OTP CODE for ${email}: ${otp}`);
    console.log(`Type: ${type}`);
    console.log(`========================================\n`);
  }
}

// Store OTP in database
async function createOTP(email: string, type: string): Promise<string> {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  await db.insert(otpCodes).values({
    email,
    code,
    type,
    expiresAt,
  });
  
  return code;
}

// Verify OTP
async function verifyOTP(email: string, code: string, type: string): Promise<boolean> {
  const [otp] = await db.select()
    .from(otpCodes)
    .where(and(
      eq(otpCodes.email, email),
      eq(otpCodes.code, code),
      eq(otpCodes.type, type),
      eq(otpCodes.used, false),
      gt(otpCodes.expiresAt, new Date())
    ))
    .limit(1);
  
  if (otp) {
    await db.update(otpCodes)
      .set({ used: true })
      .where(eq(otpCodes.id, otp.id));
    return true;
  }
  
  return false;
}

export async function setupCustomAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password
  passport.use(new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const [user] = await db.select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);
        
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }
        
        if (!user.passwordHash) {
          return done(null, false, { message: "Invalid email or password" });
        }
        
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: "Invalid email or password" });
        }
        
        if (!user.isVerified) {
          return done(null, false, { message: "Please verify your email first" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, cb) => cb(null, user.id));
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      cb(null, user || null);
    } catch (error) {
      cb(error);
    }
  });

  // Signup - Step 1: Create user
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, verificationCode } = req.body;
      
      if (!email || !password || !firstName || !verificationCode) {
        return res.status(400).json({ message: "All fields including verification code are required" });
      }

      if (verificationCode !== "HUMAN") {
        return res.status(400).json({ message: "Verification failed. Please enter 'HUMAN' to verify you are not a robot." });
      }
      
      const emailLower = email.toLowerCase();
      
      // Check if user exists
      const [existingUser] = await db.select()
        .from(users)
        .where(eq(users.email, emailLower))
        .limit(1);
      
      if (existingUser && existingUser.isVerified) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Skip verification for development or if specifically requested
      const isVerified = true; 
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      
      let user;
      if (existingUser) {
        // Update existing unverified user and verify them
        [user] = await db.update(users)
          .set({ passwordHash, firstName, lastName, isVerified })
          .where(eq(users.email, emailLower))
          .returning();
      } else {
        // Create new user and auto-verify
        [user] = await db.insert(users).values({
          email: emailLower,
          passwordHash,
          firstName,
          lastName,
          authProvider: "email",
          isVerified,
        }).returning();
      }
      
      if (user) {
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: "Login after signup failed" });
          }
          res.json({ message: "Account created successfully", user });
        });
      } else {
        res.status(500).json({ message: "Signup failed" });
      }
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Remove Signup - Step 2 (Verify OTP)

  // Login - Step 1: Validate credentials
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, verificationCode } = req.body;
      
      if (!email || !password || !verificationCode) {
        return res.status(400).json({ message: "Email, password, and verification code are required" });
      }

      // Simple math-based or static "human" verification check
      // For this implementation, we'll check if the code is '1234' or any simple logic
      if (verificationCode !== "HUMAN") {
        return res.status(400).json({ message: "Verification failed. Please enter 'HUMAN' to verify you are not a robot." });
      }
      
      const emailLower = email.toLowerCase();
      
      // Validate credentials
      const [user] = await db.select()
        .from(users)
        .where(eq(users.email, emailLower))
        .limit(1);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      
      if (!user.passwordHash) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      
      if (!user.isVerified) {
        // Just auto-verify for this simplified flow or keep the initial verification
        await db.update(users).set({ isVerified: true }).where(eq(users.id, user.id));
      }
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ message: "Login successful", user });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Remove Login - Step 2 (Verify OTP) as it's no longer needed

  // Resend OTP
  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { email, type } = req.body;
      
      if (!email || !type) {
        return res.status(400).json({ message: "Email and type are required" });
      }
      
      const emailLower = email.toLowerCase();
      
      // Check if user exists
      const [user] = await db.select()
        .from(users)
        .where(eq(users.email, emailLower))
        .limit(1);
      
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      
      const otp = await createOTP(emailLower, type);
      await sendOTPEmail(emailLower, otp, type);
      
      res.json({ message: "Verification code sent" });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Failed to resend code" });
    }
  });

  // Google OAuth mock (for frontend flow simulation)
  // In production, you'd use proper OAuth with passport-google-oauth20
  app.get("/api/auth/google", (req, res) => {
    // Redirect to Google OAuth - placeholder for now
    res.redirect("/login?error=google-oauth-not-configured");
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const user = req.user as any;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Also support GET for logout
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
