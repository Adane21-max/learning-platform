import { useState } from "react";
import { useLocation, Link } from "wouter";
import { GraduationCap, Upload, Image as ImageIcon, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    // Accept images and pdf
    if (!selected.type.startsWith("image/") && selected.type !== "application/pdf") {
      setError("Please upload an image or PDF file.");
      return;
    }
    
    setFile(selected);
    setError("");
    
    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64String.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (!file) {
      setError("Please upload your payment slip.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const base64Data = await fileToBase64(file);
      
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          paymentSlipData: base64Data,
          paymentSlipName: file.name,
          paymentSlipMime: file.type,
        }),
      });
      
      if (res.status === 201) {
        setSuccess(true);
      } else if (res.status === 409) {
        setError("An account with this email already exists.");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pattern-grid px-4">
        <div className="max-w-md w-full bg-card rounded-2xl border border-border shadow-lg p-8 text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold font-display text-foreground mb-4">Registration Submitted!</h2>
          <p className="text-muted-foreground mb-8">
            Your account is pending admin approval. You'll be able to log in once approved.
          </p>
          <Button onClick={() => setLocation("/login")} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background pattern-grid py-12 px-4">
      <Link href="/" className="flex items-center gap-2.5 mb-8 transition-transform hover:scale-105 active:scale-95">
        <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm shadow-primary/20">
          <GraduationCap className="w-6 h-6" />
        </div>
        <span className="font-display font-bold text-2xl tracking-tight text-foreground">
          Ada21<span className="text-primary">Tech</span>
        </span>
      </Link>
      
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-display text-foreground">Create an Account</h1>
            <p className="text-sm text-muted-foreground mt-2">Join Ada21Tech to access all quizzes</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Create a password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Confirm your password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Payment Slip</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="space-y-2 text-center w-full">
                    {preview ? (
                      <div className="relative w-full h-32 mb-4 mx-auto rounded-lg overflow-hidden border border-border">
                        <img src={preview} alt="Payment slip preview" className="w-full h-full object-cover" />
                      </div>
                    ) : file?.type === "application/pdf" ? (
                      <div className="mx-auto w-12 h-12 flex items-center justify-center bg-primary/10 text-primary rounded-full mb-4">
                        <FileText className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="mx-auto w-12 h-12 flex items-center justify-center bg-primary/10 text-primary rounded-full mb-4">
                        <Upload className="w-6 h-6" />
                      </div>
                    )}
                    
                    <div className="flex text-sm text-muted-foreground justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-transparent font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                        <span>{file ? "Change file" : "Upload a file"}</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*,application/pdf" onChange={handleFileChange} />
                      </label>
                      {!file && <p className="pl-1">or drag and drop</p>}
                    </div>
                    {file ? (
                      <p className="text-xs text-foreground font-medium truncate max-w-[200px] mx-auto">{file.name}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 5MB</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isSubmitting ? "Submitting..." : "Register"}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
