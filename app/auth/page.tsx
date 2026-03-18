"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

function AuthPage() {
	const router = useRouter();
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [isSigningUp, setIsSigningUp] = useState(false);

	const handleLoginSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	): Promise<void> => {
		event.preventDefault();
		setIsLoggingIn(true);

		try {
			const formData = new FormData(event.currentTarget);
			const email = (formData.get("email") as string | null) ?? "";
			const password = (formData.get("password") as string | null) ?? "";

			if (!email || !password) {
				toast.error("Please enter email and password.");
				return;
			}

			const { error } = await authClient.signIn.email({
				email,
				password,
				callbackURL: "/",
			});

			if (error) {
				const message =
					typeof error === "object" && error !== null && "message" in error
						? String(error.message)
						: "Failed to sign in.";
				toast.error(message);
				return;
			}

			router.push("/");
		} catch (_error: unknown) {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsLoggingIn(false);
		}
	};

	const handleSignupSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	): Promise<void> => {
		event.preventDefault();
		setIsSigningUp(true);

		try {
			const formData = new FormData(event.currentTarget);
			const email = (formData.get("email") as string | null) ?? "";
			const password = (formData.get("password") as string | null) ?? "";
			const name = (formData.get("name") as string | null) ?? "";

			if (!name || !email || !password) {
				toast.error("Please enter name, email and password.");
				return;
			}

			const { error } = await authClient.signUp.email({
				email,
				name,
				password,
				callbackURL: "/",
			});

			if (error) {
				const message =
					typeof error === "object" && error !== null && "message" in error
						? String(error.message)
						: "Failed to sign up.";
				toast.error(message);
				return;
			}

			toast.success(
				"Account created. Please check your email if verification is required.",
			);
			router.push("/");
		} catch (_error: unknown) {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSigningUp(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-md space-y-6">
				<h1 className="text-center text-2xl font-semibold">Welcome</h1>

				<Tabs defaultValue="login" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="login">Login</TabsTrigger>
						<TabsTrigger value="signup">Sign Up</TabsTrigger>
					</TabsList>

					<TabsContent value="login" className="mt-6">
						<form className="space-y-4" onSubmit={handleLoginSubmit}>
							<div className="space-y-2">
								<Label htmlFor="login-email">Email</Label>
								<Input
									id="login-email"
									name="email"
									type="email"
									autoComplete="email"
									placeholder="you@example.com"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="login-password">Password</Label>
								<Input
									id="login-password"
									name="password"
									type="password"
									autoComplete="current-password"
									placeholder="********"
									required
								/>
							</div>
							<Button className="w-full" type="submit" disabled={isLoggingIn}>
								{isLoggingIn ? "Logging in..." : "Login"}
							</Button>
						</form>
					</TabsContent>

					<TabsContent value="signup" className="mt-6">
						<form className="space-y-4" onSubmit={handleSignupSubmit}>
							<div className="space-y-2">
								<Label htmlFor="signup-name">Name</Label>
								<Input
									id="signup-name"
									name="name"
									type="text"
									autoComplete="name"
									placeholder="Your name"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="signup-email">Email</Label>
								<Input
									id="signup-email"
									name="email"
									type="email"
									autoComplete="email"
									placeholder="you@example.com"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="signup-password">Password</Label>
								<Input
									id="signup-password"
									name="password"
									type="password"
									autoComplete="new-password"
									placeholder="At least 8 characters"
									minLength={8}
									required
								/>
							</div>
							<Button className="w-full" type="submit" disabled={isSigningUp}>
								{isSigningUp ? "Creating account..." : "Sign Up"}
							</Button>
						</form>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

export default AuthPage;
