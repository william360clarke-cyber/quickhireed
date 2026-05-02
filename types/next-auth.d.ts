import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      userType: "customer" | "provider" | "admin" | "both";
    };
  }

  interface User {
    userType: "customer" | "provider" | "admin" | "both";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userType: "customer" | "provider" | "admin" | "both";
  }
}
