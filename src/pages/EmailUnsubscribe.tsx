// @ts-nocheck
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MailX, CheckCircle2, AlertCircle } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function EmailUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json();
        if (data.valid === false && data.reason === "already_unsubscribed") setStatus("already");
        else if (data.valid) setStatus("valid");
        else setStatus("invalid");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch { setStatus("error"); }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Verifying…</p>
            </>
          )}

          {status === "valid" && (
            <>
              <MailX className="h-12 w-12 text-primary mx-auto" />
              <h1 className="text-xl font-semibold text-foreground">Unsubscribe from emails</h1>
              <p className="text-muted-foreground text-sm">
                You'll stop receiving app emails from Afrinnect. Important account emails will still be sent.
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Unsubscribe
              </Button>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h1 className="text-xl font-semibold text-foreground">You've been unsubscribed</h1>
              <p className="text-muted-foreground text-sm">You won't receive app emails from Afrinnect anymore.</p>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto" />
              <h1 className="text-xl font-semibold text-foreground">Already unsubscribed</h1>
              <p className="text-muted-foreground text-sm">You've already opted out of app emails.</p>
            </>
          )}

          {(status === "invalid" || status === "error") && (
            <>
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-xl font-semibold text-foreground">
                {status === "invalid" ? "Invalid link" : "Something went wrong"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {status === "invalid"
                  ? "This unsubscribe link is invalid or expired."
                  : "Please try again later."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
