import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListQuizzes, getListQuizzesQueryKey, getGetQuizQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import {
  Loader2, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle,
  CheckCircle2, Lock, Users, BookOpen, Eye, X, Check, Ban, XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: number;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  rejectionReason: string | null;
  createdAt: string;
  approvedAt: string | null;
  hasPaymentSlip: boolean;
}

// ─── Password Gate ─────────────────────────────────────────────────────────────

function AdminPasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin_auth", "true");
        onUnlock();
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pattern-grid">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-sm p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold font-display text-foreground">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">Enter your admin password to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {error && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Unlock Admin
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Student["status"] }) {
  const styles: Record<Student["status"], string> = {
    pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved:  "bg-green-100 text-green-800 border-green-200",
    rejected:  "bg-red-100 text-red-800 border-red-200",
    suspended: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

// ─── Payment Slip Modal ────────────────────────────────────────────────────────

function PaymentSlipModal({ studentId, onClose }: { studentId: number; onClose: () => void }) {
  const [slip, setSlip] = useState<{ fileData: string; fileName: string; mimeType: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/students/${studentId}/payment-slip`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSlip(data);
      })
      .catch(() => setError("Failed to load payment slip."))
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Payment Slip</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="text-destructive text-sm text-center py-6">{error}</p>
          ) : slip ? (
            slip.mimeType.startsWith("image/") ? (
              <img
                src={`data:${slip.mimeType};base64,${slip.fileData}`}
                alt="Payment slip"
                className="w-full rounded-lg border border-border object-contain max-h-96"
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">PDF payment slip: <strong>{slip.fileName}</strong></p>
                <a
                  href={`data:${slip.mimeType};base64,${slip.fileData}`}
                  download={slip.fileName}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  Download PDF
                </a>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Reject Modal ──────────────────────────────────────────────────────────────

function RejectModal({ studentId, onClose, onDone }: { studentId: number; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    setLoading(true);
    try {
      await fetch(`/api/admin/students/${studentId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Reject Registration</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">Optionally provide a reason that will be shown to the student when they try to log in.</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (optional)..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Students Tab ──────────────────────────────────────────────────────────────

function StudentsTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slipStudentId, setSlipStudentId] = useState<number | null>(null);
  const [rejectStudentId, setRejectStudentId] = useState<number | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/students");
      if (!res.ok) throw new Error("Failed");
      setStudents(await res.json());
    } catch {
      setError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const doAction = async (studentId: number, action: "approve" | "suspend") => {
    await fetch(`/api/admin/students/${studentId}/${action}`, { method: "POST" });
    fetchStudents();
  };

  const pendingCount = students.filter((s) => s.status === "pending").length;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error) return <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-3"><AlertCircle className="w-5 h-5" />{error}</div>;

  return (
    <div>
      {slipStudentId && <PaymentSlipModal studentId={slipStudentId} onClose={() => setSlipStudentId(null)} />}
      {rejectStudentId && (
        <RejectModal
          studentId={rejectStudentId}
          onClose={() => setRejectStudentId(null)}
          onDone={fetchStudents}
        />
      )}

      {pendingCount > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3 text-yellow-800">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{pendingCount} student{pendingCount > 1 ? "s" : ""} waiting for approval.</span>
        </div>
      )}

      {students.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border border-border shadow-sm">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-xl font-semibold text-foreground mb-2">No students yet</p>
          <p className="text-muted-foreground">Students will appear here once they register.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div key={student.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-foreground text-lg">{student.name}</p>
                    <StatusBadge status={student.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Registered: {new Date(student.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    {student.approvedAt && ` · Approved: ${new Date(student.approvedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`}
                  </p>
                  {student.status === "rejected" && student.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {student.rejectionReason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {student.hasPaymentSlip && (
                    <Button size="sm" variant="outline" onClick={() => setSlipStudentId(student.id)} className="gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      Slip
                    </Button>
                  )}
                  {(student.status === "pending" || student.status === "rejected" || student.status === "suspended") && (
                    <Button size="sm" onClick={() => doAction(student.id, "approve")} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                  )}
                  {(student.status === "pending" || student.status === "approved") && (
                    <Button size="sm" variant="destructive" onClick={() => setRejectStudentId(student.id)} className="gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  )}
                  {student.status === "approved" && (
                    <Button size="sm" variant="outline" onClick={() => doAction(student.id, "suspend")} className="gap-1.5 text-gray-600 border-gray-300 hover:bg-gray-50">
                      <Ban className="w-3.5 h-3.5" />
                      Suspend
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quiz Question Manager ────────────────────────────────────────────────────

function QuizQuestionManager({ quizId }: { quizId: number }) {
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localCorrectAnswers, setLocalCorrectAnswers] = useState<Record<number, string>>({});

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useState(() => { fetchQuestions(); });

  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"multiple_choice" | "true_false" | "short_answer">("multiple_choice");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => setOptions([...options, ""]);
  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) {
      const newOpts = [...options];
      newOpts.splice(idx, 1);
      setOptions(newOpts);
      if (correctAnswer === options[idx]) setCorrectAnswer("");
    }
  };
  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalOptions: string[] | null = null;
    let finalCorrectAnswer = correctAnswer;

    if (questionType === "multiple_choice") {
      if (options.some((o) => !o.trim())) { alert("Please fill in all options"); return; }
      if (!correctAnswer) { alert("Please select a correct answer"); return; }
      finalOptions = options;
    } else if (questionType === "true_false") {
      finalOptions = ["True", "False"];
      if (!correctAnswer) finalCorrectAnswer = "True";
    } else {
      if (!correctAnswer.trim()) { alert("Please provide a correct answer"); return; }
      finalOptions = null;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText, questionType, options: finalOptions, correctAnswer: finalCorrectAnswer, explanation: explanation || undefined }),
      });
      if (res.ok) {
        const added = await res.json();
        setLocalCorrectAnswers((prev) => ({ ...prev, [added.id]: added.correctAnswer }));
        setQuestionText(""); setQuestionType("multiple_choice"); setOptions(["", ""]); setCorrectAnswer(""); setExplanation("");
        setIsAddingQuestion(false);
        await fetchQuestions();
        queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(quizId) });
      } else {
        alert("Failed to add question.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`, { method: "DELETE" });
      if (res.ok) { await fetchQuestions(); queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(quizId) }); }
    } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold font-display text-foreground">Questions ({questions.length})</h4>
        {!isAddingQuestion && (
          <Button size="sm" onClick={() => setIsAddingQuestion(true)} className="gap-2">
            <Plus className="w-4 h-4" />Add Question
          </Button>
        )}
      </div>

      {isAddingQuestion && (
        <div className="bg-background rounded-xl p-6 border border-border mb-6 shadow-sm">
          <h5 className="font-bold mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />New Question</h5>
          <form onSubmit={handleAddQuestion} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Question Text</label>
              <textarea required value={questionText} onChange={(e) => setQuestionText(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter your question..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Question Type</label>
              <select value={questionType} onChange={(e) => { const t = e.target.value as any; setQuestionType(t); setCorrectAnswer(t === "true_false" ? "True" : ""); }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>

            {questionType === "multiple_choice" && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                <label className="text-sm font-semibold block">Options</label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input required value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder={`Option ${idx + 1}`} />
                    <Button type="button" variant="outline" className="shrink-0" onClick={() => handleRemoveOption(idx)} disabled={options.length <= 2}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddOption} className="mt-2 text-xs">+ Add Option</Button>
                <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                  <label className="text-sm font-semibold">Correct Answer</label>
                  <select required value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <option value="" disabled>Select correct option...</option>
                    {options.filter((o) => o.trim() !== "").map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            )}

            {questionType === "true_false" && (
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                <label className="text-sm font-semibold">Correct Answer</label>
                <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </div>
            )}

            {questionType === "short_answer" && (
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                <label className="text-sm font-semibold">Correct Answer</label>
                <input required value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Exact text for correct answer..." />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Explanation (Optional)</label>
              <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Explain why the answer is correct..." />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddingQuestion(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Add Question
              </Button>
            </div>
          </form>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm bg-background rounded-xl border border-dashed border-border">No questions added yet.</div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-4 bg-background border border-border rounded-xl flex gap-4 group">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{idx + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground whitespace-pre-wrap">{q.questionText}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 rounded bg-muted/50 font-medium capitalize">{q.questionType.replace("_", " ")}</span>
                  {(q.correctAnswer || localCorrectAnswers[q.id]) && (
                    <span className="px-2 py-1 rounded bg-green-50 text-green-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />Answer: {q.correctAnswer || localCorrectAnswers[q.id]}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                onClick={() => handleDeleteQuestion(q.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quizzes Tab ───────────────────────────────────────────────────────────────

function QuizzesTab() {
  const queryClient = useQueryClient();
  const { data: quizzes, isLoading, error } = useListQuizzes();
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizSubject, setNewQuizSubject] = useState("");
  const [newQuizDescription, setNewQuizDescription] = useState("");

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newQuizTitle, subject: newQuizSubject, description: newQuizDescription }),
      });
      if (res.ok) {
        setNewQuizTitle(""); setNewQuizSubject(""); setNewQuizDescription(""); setIsCreatingQuiz(false);
        queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
      if (res.ok) {
        if (expandedQuizId === quizId) setExpandedQuizId(null);
        queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button onClick={() => setIsCreatingQuiz(!isCreatingQuiz)} className="gap-2">
          <Plus className="w-4 h-4" />Create Quiz
        </Button>
      </div>

      {isCreatingQuiz && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-2xl font-bold font-display mb-4">Create New Quiz</h2>
          <form onSubmit={handleCreateQuiz} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Title</label>
                <input required value={newQuizTitle} onChange={(e) => setNewQuizTitle(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g. Intro to Biology" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Subject</label>
                <input required value={newQuizSubject} onChange={(e) => setNewQuizSubject(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g. Science" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Description</label>
              <textarea required value={newQuizDescription} onChange={(e) => setNewQuizDescription(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="What is this quiz about?" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreatingQuiz(false)}>Cancel</Button>
              <Button type="submit">Save Quiz</Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-3"><AlertCircle className="w-5 h-5" /><p>Failed to load quizzes.</p></div>
      ) : quizzes?.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border border-border shadow-sm">
          <h3 className="text-2xl font-bold font-display text-foreground mb-2">No quizzes yet</h3>
          <p className="text-muted-foreground">Create your first quiz to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes?.map((quiz) => (
            <div key={quiz.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all">
              <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                onClick={() => setExpandedQuizId(expandedQuizId === quiz.id ? null : quiz.id)}>
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground">{quiz.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{quiz.subject}</span>
                    <span className="text-sm text-muted-foreground">{quiz.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(quiz.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="p-2 rounded-full hover:bg-muted text-muted-foreground">
                    {expandedQuizId === quiz.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>
              {expandedQuizId === quiz.id && (
                <div className="border-t border-border bg-muted/10 p-6">
                  <QuizQuestionManager quizId={quiz.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem("admin_auth") === "true"
  );
  const [activeTab, setActiveTab] = useState<"quizzes" | "students">("students");

  if (!isAuthenticated) {
    return <AdminPasswordGate onUnlock={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col pattern-grid bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold font-display text-foreground tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage students, quizzes, and platform content.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8 w-fit">
          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "students"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Students
          </button>
          <button
            onClick={() => setActiveTab("quizzes")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "quizzes"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Quizzes
          </button>
        </div>

        {activeTab === "students" ? <StudentsTab /> : <QuizzesTab />}
      </main>
    </div>
  );
}
