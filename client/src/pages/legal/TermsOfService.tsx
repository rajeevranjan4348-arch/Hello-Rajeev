import { Layout } from "@/components/Layout";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
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
            <h1 className="text-3xl font-display font-bold">Zenix Terms of Service</h1>
          </div>
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl border border-primary/20">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Please read our community guidelines.</span>
          </div>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">1</span>
              Acceptance of Terms
            </h2>
            <p className="text-muted-foreground mt-3">
              By accessing or using Zenix, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">2</span>
              User Responsibilities
            </h2>
            <p className="text-muted-foreground mt-3">
              You are responsible for your use of Zenix and for any content you provide, including compliance with applicable laws and regulations in India and elsewhere.
            </p>
          </section>

          <section className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">3</span>
              Prohibited Conduct
            </h2>
            <p className="text-muted-foreground mt-3">
              You agree not to engage in any conduct that interferes with or disrupts the Zenix service or servers. This includes any form of harassment or illegal activity.
            </p>
          </section>

          <section className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">4</span>
              Termination
            </h2>
            <p className="text-muted-foreground mt-3">
              We reserve the right to terminate or suspend your access to Zenix at any time, without prior notice, for conduct that we believe violates these Terms.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
