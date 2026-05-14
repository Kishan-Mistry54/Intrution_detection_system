import { useState, useCallback } from "react";
import { Upload, Search, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface ParsedRow {
  [key: string]: string;
}

interface AnalyzedRow extends ParsedRow {
  prediction: "Normal" | "Attack";
}

const Analyzer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [results, setResults] = useState<AnalyzedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return { headers: [], rows: [] };
    const csvHeaders = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1, 51).map((line) => {
      const values = line.split(",");
      const row: ParsedRow = {};
      csvHeaders.forEach((h, i) => {
        row[h] = values[i]?.trim() || "";
      });
      return row;
    });
    return { headers: csvHeaders, rows };
  };

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith(".csv")) {
      toast.error("Only .csv files are accepted");
      return;
    }
    setFile(f);
    setResults([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows } = parseCSV(text);
      setHeaders(h);
      setParsedData(rows);
      toast.success(`Loaded ${rows.length} rows from ${f.name}`);
    };
    reader.readAsText(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);

    // 1. Prepare the data to send to Python
    const csvContent = [
      Object.keys(parsedData[0]).join(','), 
      ...parsedData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', csvBlob, 'data.csv');

    try {
      // 2. Send to Python Backend
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData,
      }); // <-- KEEP THIS CLOSED HERE, do not put catch here yet

      const data = await response.json();

      if (data.status === 'success') {
        const analyzed: AnalyzedRow[] = parsedData.map((row, index) => ({
          ...row,
          prediction: data.predictions[index],
        }));

        setResults(analyzed);

        // --- SAVE STATS FOR DASHBOARD ---
        const attacks = analyzed.filter((r) => r.prediction !== "Normal").length;
        const normal = analyzed.filter((r) => r.prediction === "Normal").length;

        const newEntry = {
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          attacks: attacks,
          normal: normal,
          total: analyzed.length,
        };

        const history = JSON.parse(localStorage.getItem('scan_history') || '[]');
        history.push(newEntry);
        if (history.length > 10) history.shift(); 
        localStorage.setItem('scan_history', JSON.stringify(history));
        // ---------------------------------

        if (attacks > 0) {
          toast.warning(`⚠ ${attacks} potential threats detected!`);
        } else {
          toast.success("All traffic appears normal");
        }
      } else {
        toast.error("Error analyzing file: " + data.message);
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("Critical Error: Check Python Terminal for errors!");
      toast.error("Could not connect to the Python server.");
    } finally {
      setAnalyzing(false);
    }
  };

  const displayHeaders = headers.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Traffic Analyzer</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a CSV file containing network traffic data for ML-based analysis
        </p>
      </div>

      {/* Upload Area */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("csv-upload")?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
              transition-all duration-300
              ${
                dragOver
                  ? "border-primary bg-primary/5 glow-cyan"
                  : "border-border hover:border-primary/50 hover:bg-secondary/30"
              }
            `}
          >
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Upload
              className={`h-12 w-12 mx-auto mb-4 ${
                dragOver ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <p className="text-foreground font-medium mb-1">
              {file ? file.name : "Drop your CSV file here"}
            </p>
            <p className="text-sm text-muted-foreground">
              {file
                ? `${parsedData.length} rows loaded`
                : "or click to browse • .csv files only"}
            </p>
            {file && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-mono">
                <FileText className="h-3 w-3" />
                {file.name}
              </div>
            )}
          </div>

          {parsedData.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="cyber"
                size="lg"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="min-w-[200px]"
              >
                {analyzing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Analyze Traffic
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Analysis Results
              <span className="ml-auto text-sm font-mono text-muted-foreground">
                {results.filter((r) => r.prediction === "Attack").length} threats /{" "}
                {results.length} total
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="text-muted-foreground font-mono text-xs">#</TableHead>
                      {displayHeaders.map((h) => (
                        <TableHead key={h} className="text-muted-foreground font-mono text-xs">
                          {h}
                        </TableHead>
                      ))}
                      <TableHead className="text-muted-foreground font-mono text-xs">
                        Prediction
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, i) => {
                      const isAttack = row.prediction === "Attack";
                      return (
                        <TableRow
                          key={i}
                          className={
                            isAttack
                              ? "bg-neon-red/5 hover:bg-neon-red/10 border-l-2 border-l-neon-red"
                              : "hover:bg-secondary/30"
                          }
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {i + 1}
                          </TableCell>
                          {displayHeaders.map((h) => (
                            <TableCell key={h} className="font-mono text-xs text-foreground">
                              {row[h]}
                            </TableCell>
                          ))}
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                isAttack
                                  ? "bg-neon-red/15 text-neon-red"
                                  : "bg-neon-green/15 text-neon-green"
                              }`}
                            >
                              {isAttack ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              {row.prediction}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analyzer;
