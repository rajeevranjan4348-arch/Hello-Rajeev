import { Layout } from "@/components/Layout";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <Layout showNav={false}>
      <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link href="/">
            <button className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-3xl font-display font-bold">Privacy Policy</h1>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly to us, such as your name, phone number, and profile information when you create an account or update your profile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use the information we collect to provide, maintain, and improve our services, including to facilitate messaging and calling between users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">3. Data Security</h2>
            <p className="text-muted-foreground">
              We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">4. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
