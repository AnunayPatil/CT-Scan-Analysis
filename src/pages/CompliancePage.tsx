import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Lock, Eye, FileCheck, Server, Users, AlertTriangle, CheckCircle, Globe } from "lucide-react";

export default function CompliancePage() {
  const complianceFrameworks = [
    {
      icon: Shield,
      title: "HIPAA",
      subtitle: "Health Insurance Portability and Accountability Act",
      status: "Compliant",
      color: "text-green-500",
    },
    {
      icon: Globe,
      title: "GDPR",
      subtitle: "General Data Protection Regulation",
      status: "Compliant",
      color: "text-blue-500",
    },
    {
      icon: Lock,
      title: "SOC 2 Type II",
      subtitle: "Service Organization Control",
      status: "In Progress",
      color: "text-yellow-500",
    },
  ];

  const securityMeasures = [
    {
      title: "End-to-End Encryption",
      description: "All data is encrypted using AES-256 encryption both in transit (TLS 1.3) and at rest.",
      icon: Lock,
    },
    {
      title: "Access Control",
      description: "Role-based access control (RBAC) ensures users only access data relevant to their role.",
      icon: Users,
    },
    {
      title: "Audit Logging",
      description: "Comprehensive audit trails track all access and modifications to patient data.",
      icon: FileCheck,
    },
    {
      title: "Secure Infrastructure",
      description: "Hosted on AWS with VPC isolation, WAF protection, and regular security patching.",
      icon: Server,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compliance & Security</h1>
        <p className="text-muted-foreground">Data protection, privacy policies, and regulatory compliance</p>
      </div>

      {/* Compliance Status */}
      <div className="grid gap-4 md:grid-cols-3">
        {complianceFrameworks.map((framework) => (
          <Card key={framework.title}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <framework.icon className={`h-8 w-8 ${framework.color}`} />
                <Badge variant={framework.status === "Compliant" ? "default" : "secondary"}>
                  {framework.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold">{framework.title}</h3>
              <p className="text-sm text-muted-foreground">{framework.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Measures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Measures
          </CardTitle>
          <CardDescription>Technical safeguards protecting your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {securityMeasures.map((measure) => (
              <div key={measure.title} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <measure.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{measure.title}</h4>
                  <p className="text-sm text-muted-foreground">{measure.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* HIPAA Compliance Details */}
      <Card>
        <CardHeader>
          <CardTitle>HIPAA Compliance</CardTitle>
          <CardDescription>How we protect Protected Health Information (PHI)</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="administrative">
              <AccordionTrigger>Administrative Safeguards</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>Security management process with designated security officer</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>Workforce security training and awareness programs</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>Information access management and authorization</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>Contingency planning and disaster recovery procedures</p>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="physical">
              <AccordionTrigger>Physical Safeguards</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>Facility access controls with multi-factor authentication</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>Workstation use policies and device security</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>AWS data centers with SOC 2 certification</p>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="technical">
              <AccordionTrigger>Technical Safeguards</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>Access control with unique user identification</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>Automatic logoff and session timeout policies</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>Encryption and decryption of PHI</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>Audit controls and activity logging</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* GDPR Compliance Details */}
      <Card>
        <CardHeader>
          <CardTitle>GDPR Compliance</CardTitle>
          <CardDescription>Data protection rights for EU residents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: "Right to Access", desc: "Users can request a copy of their personal data" },
              { title: "Right to Rectification", desc: "Users can correct inaccurate personal data" },
              { title: "Right to Erasure", desc: "Users can request deletion of their data" },
              { title: "Right to Portability", desc: "Users can receive data in a portable format" },
              { title: "Right to Object", desc: "Users can object to certain data processing" },
              { title: "Right to Restriction", desc: "Users can request limited processing" },
            ].map((right) => (
              <div key={right.title} className="flex items-start gap-3 rounded-lg border p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                <div>
                  <h4 className="font-semibold">{right.title}</h4>
                  <p className="text-sm text-muted-foreground">{right.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Data Handling Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Data Collection</h4>
            <p className="text-sm text-muted-foreground">
              We collect only the minimum data necessary for providing diagnostic services: patient identifiers, 
              CT scan images, analysis results, and user account information. No data is collected for marketing purposes.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Data Retention</h4>
            <p className="text-sm text-muted-foreground">
              Scan data and analysis results are retained for 7 years in compliance with medical record-keeping 
              requirements. Users may request earlier deletion where legally permitted.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Data Sharing</h4>
            <p className="text-sm text-muted-foreground">
              Patient data is never sold or shared with third parties. Data may only be shared with authorized 
              healthcare providers within the same institution or as required by law.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">AI Model Training</h4>
            <p className="text-sm text-muted-foreground">
              CT scans processed through our system are not used for model training without explicit consent. 
              Our models are trained exclusively on anonymized, consented datasets.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-amber-500/50 bg-amber-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
            Important Disclaimers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-amber-700/90 dark:text-amber-300/90">
          <p className="text-sm">
            <strong>Medical Device Disclaimer:</strong> This AI-powered CT scan analysis system is intended 
            as a clinical decision support tool only. It is not a replacement for professional medical judgment. 
            All AI-generated findings must be reviewed and confirmed by qualified healthcare professionals.
          </p>
          <p className="text-sm">
            <strong>Accuracy Disclaimer:</strong> While our CNN–GA–BiLSTM model achieves 96% accuracy in 
            controlled studies, no AI system is infallible. False positives and false negatives may occur. 
            Clinical correlation is always required.
          </p>
          <p className="text-sm">
            <strong>Emergency Disclaimer:</strong> This system is not designed for emergency diagnosis. 
            In case of suspected stroke, follow established emergency protocols and seek immediate medical attention.
          </p>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Inquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            For questions regarding our compliance practices, data protection policies, or to exercise your 
            data rights, please contact our Data Protection Officer:
          </p>
          <div className="mt-4 rounded-lg border p-4">
            <p className="font-medium">Data Protection Officer</p>
            <p className="text-sm text-muted-foreground">Email: dpo@ctanalyzer.health</p>
            <p className="text-sm text-muted-foreground">Response time: Within 30 days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
