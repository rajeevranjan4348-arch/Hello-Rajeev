import { Layout } from "@/components/Layout";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <Layout showNav={false}>
      <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto space-y-8">
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
            </Link>
            <h1 className="text-3xl font-display font-bold">Zenix Privacy Policy</h1>
          </div>
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Your privacy is our priority at Zenix.</span>
          </div>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">1</span>
              Information We Collect
            </h2>
            <p className="text-muted-foreground mt-3">
              We collect information you provide directly to us, such as your name, phone number, and profile information when you create an account or update your profile. At Zenix, we ensure your data is handled with care.
            </p>
          </section>

          <section className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">2</span>
              How We Use Your Information
            </h2>
            <p className="text-muted-foreground mt-3">
              We use the information we collect to provide, maintain, and improve our services, including to facilitate messaging and calling between users. Your information helps us make Zenix better for everyone.
            </p>
          </section>

          <section className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">3</span>
              Data Security
            </h2>
            <p className="text-muted-foreground mt-3">
              We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access. Zenix employs state-of-the-art encryption to keep your chats safe.
            </p>
          </section>

          <section className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">4</span>
              Contact Us
            </h2>
            <p className="text-muted-foreground mt-3">
              If you have any questions about this Zenix Privacy Policy, please contact our support team.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
