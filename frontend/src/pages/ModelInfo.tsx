import { Brain, Layers, Target, Database, Cpu, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  { label: "Accuracy", value: "96.8%", color: "text-neon-green" },
  { label: "Precision", value: "95.2%", color: "text-primary" },
  { label: "Recall", value: "94.7%", color: "text-primary" },
  { label: "F1-Score", value: "94.9%", color: "text-neon-green" },
];

const features = [
  "duration", "protocol_type", "service", "flag", "src_bytes",
  "dst_bytes", "land", "wrong_fragment", "urgent", "hot",
  "num_failed_logins", "logged_in", "num_compromised", "root_shell",
  "su_attempted", "num_root", "num_file_creations",
];

const ModelInfo = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Model Information</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Details about the ML model architecture and training pipeline
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Architecture */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-primary" />
              Model Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Algorithm" value="Random Forest Classifier" />
            <InfoRow label="Estimators" value="100 trees" />
            <InfoRow label="Max Depth" value="None (fully grown)" />
            <InfoRow label="Framework" value="scikit-learn 1.3.x" />
            <InfoRow label="Classification" value="Binary (Normal / Attack)" />
          </CardContent>
        </Card>

        {/* Dataset */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2 text-base">
              <Database className="h-5 w-5 text-primary" />
              Training Dataset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Dataset" value="NSL-KDD" />
            <InfoRow label="Training Samples" value="125,973" />
            <InfoRow label="Test Samples" value="22,544" />
            <InfoRow label="Attack Types" value="DoS, Probe, R2L, U2R" />
            <InfoRow label="Normal Ratio" value="~53% Normal, ~47% Attack" />
          </CardContent>
        </Card>
      </div>

      {/* Performance */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-border bg-secondary/30 p-4 text-center"
              >
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">
                  {m.label}
                </p>
                <p className={`text-2xl font-bold font-mono ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Cpu className="h-5 w-5 text-primary" />
            Processing Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {["Data Ingestion", "Feature Extraction", "Normalization", "Model Inference", "Classification"].map(
              (step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border">
                    <span className="text-xs font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm text-foreground">{step}</span>
                  </div>
                  {i < 4 && <span className="text-muted-foreground">→</span>}
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Layers className="h-5 w-5 text-primary" />
            Key Features ({features.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {features.map((f) => (
              <span
                key={f}
                className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-mono border border-primary/20"
              >
                {f}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-mono text-foreground">{value}</span>
    </div>
  );
}

export default ModelInfo;
