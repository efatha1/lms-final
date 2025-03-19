import { SignUpForm } from "@/components/auth/signup-form";
import { fine } from "@/lib/fine";
import { Link, Navigate } from "react-router";

export default function SignupPage() {
  if (!fine) return <Navigate to='/' />;

  return (
    <div className='flex h-screen w-screen flex-col items-center justify-center'>
      <div className='flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>Create an account</h1>
          <p className='text-sm text-muted-foreground'>Enter your details below to create your account</p>
        </div>
        <SignUpForm withGithub={false} />
        <p className='px-8 text-center text-sm text-muted-foreground'>
          Already have an account?{" "}
          <Link to='/login' className='underline underline-offset-4 hover:text-primary'>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
