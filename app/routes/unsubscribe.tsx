import { useState } from "react";
import { useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { unsubscribeEmail } from "~/lib/api";
import { toast } from "sonner";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sendKey = searchParams.get("k") || "";
  const sender = searchParams.get("from") || "";
  const receiver = searchParams.get("to") || "";

  const handleCancel = () => {
    toast.info("No changes made. You can close this tab now.", {
      duration: 4000,
    });
  };

  const handleUnsubscribe = async () => {
    if (!sendKey || !sender || !receiver) {
      toast.error("Missing required parameters");
      setError("Missing required parameters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await unsubscribeEmail({
        k: sendKey,
        from: sender,
        to: receiver,
      });

      if (response.status === 200) {
        setSuccess(true);
        toast.success("Successfully unsubscribed! You will no longer receive emails from this sender.", {
          duration: 4000,
        });
      } else {
        const errorMsg = response.message || "Failed to unsubscribe";
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center p-6">
        <Card className="w-full max-w-[520px] border border-[#eee]">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-semibold text-green-600">
              ✓ Successfully Unsubscribed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[#444] leading-relaxed">
              You have been successfully unsubscribed from future emails.
            </p>
            <p className="text-[#777] text-sm">
              You will no longer receive emails from this sender.
            </p>
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mt-4">
              <p className="text-sm font-medium">You can now close this tab.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center p-6">
      <Card className="w-full max-w-[520px] border border-[#eee]">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold">
            Confirm unsubscribe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#444] leading-relaxed">
            Are you sure you want to unsubscribe from future emails?
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleUnsubscribe}
              disabled={loading}
              className="bg-[#d92d20] hover:bg-[#b91c1c] text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Yes, unsubscribe"}
            </Button>

            <button
              type="button"
              onClick={handleCancel}
              className="text-[#555] hover:text-[#333] no-underline transition-colors cursor-pointer bg-transparent border-none"
            >
              Cancel
            </button>
          </div>

          <p className="text-[#777] text-xs pt-2">
            If you didn't request this, you can safely close this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
