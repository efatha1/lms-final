import { SignInForm } from "@/components/auth/login-form";
import { fine } from "@/lib/fine";
import { Link, Navigate } from "react-router";

export default function LoginPage() {
  if (!fine) return <Navigate to='/' />;

  return (
    <div className='flex h-screen w-screen flex-col items-center justify-center'>
      <div className='flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>Welcome back</h1>
          <p className='text-sm text-muted-foreground'>Enter your credentials to sign in to your account</p>
        </div>
        <SignInForm withGithub={false} />
        <p className='px-8 text-center text-sm text-muted-foreground'>
          Don't have an account?{" "}
          <Link to='/signup' className='underline underline-offset-4 hover:text-primary'>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
