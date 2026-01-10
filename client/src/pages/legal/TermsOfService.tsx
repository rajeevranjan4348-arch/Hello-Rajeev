import { Layout } from "@/components/Layout";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <Layout showNav={false}>
      <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link href="/">
            <button className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-3xl font-display font-bold">Terms of Service</h1>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using SwiftChat, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">2. User Responsibilities</h2>
            <p className="text-muted-foreground">
              You are responsible for your use of the service and for any content you provide, including compliance with applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">3. Prohibited Conduct</h2>
            <p className="text-muted-foreground">
              You agree not to engage in any conduct that interferes with or disrupts the service or servers connected to the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">4. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to terminate or suspend your access to the service at any time, without prior notice, for conduct that we believe violates these Terms.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
