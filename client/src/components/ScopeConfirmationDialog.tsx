import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, AlertTriangle } from "lucide-react";

interface ScopeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  targetUrl: string;
  isLoading?: boolean;
}

export function ScopeConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  targetUrl,
  isLoading = false,
}: ScopeConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-slate-700">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <AlertDialogTitle className="text-cyan-300">Scope Verification Required</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-slate-300">
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Target URL:</div>
                <div className="font-mono text-sm text-cyan-300 break-all">{targetUrl}</div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Authorization Checklist
                </h4>
                <ul className="text-sm text-slate-300 space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">✓</span>
                    <span>I have explicit written permission to test this target</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">✓</span>
                    <span>This target is within the authorized scope</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">✓</span>
                    <span>I understand the legal implications of unauthorized testing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">✓</span>
                    <span>I will only perform ethical, non-destructive testing</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-red-950 rounded-lg border border-red-800 text-xs text-red-200">
                <strong>⚠️ Warning:</strong> Unauthorized security testing is illegal. HAWK is designed for authorized testing only.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-cyan-900 border-cyan-700 text-cyan-300 hover:bg-cyan-800"
          >
            {isLoading ? "Starting..." : "I Confirm - Proceed"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
