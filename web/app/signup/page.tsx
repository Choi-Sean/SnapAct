import AuthForm from '@/components/AuthForm';
import Nav from '@/components/Nav';

export default function SignupPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto flex min-h-[70vh] max-w-content items-center justify-center px-6 py-16">
        <AuthForm mode="signup" />
      </main>
    </>
  );
}
