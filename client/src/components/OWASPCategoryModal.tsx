import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CodeBlock } from "@/components/CodeBlock";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface OWASPCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
}

export function OWASPCategoryModal({
  open,
  onOpenChange,
  category,
}: OWASPCategoryModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const categoryQuery = trpc.owasp.getCategory.useQuery(
    { category },
    { enabled: false }
  );

  useEffect(() => {
    if (open && category) {
      setLoading(true);
      categoryQuery.refetch().then((result) => {
        if (result.data) {
          setData(result.data);
        }
        setLoading(false);
      });
    }
  }, [open, category]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-cyan-300">{category}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Detailed security guidance and testing checklist
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {data.title && (
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{data.title}</h3>
                <p className="text-slate-300">{data.description}</p>
              </div>
            )}

            {data.examples && data.examples.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-200 mb-3">Example Scenarios</h4>
                <div className="space-y-2">
                  {data.examples.map((example: string, i: number) => (
                    <div key={i} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                      <p className="text-sm text-slate-300">{example}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.checklist && data.checklist.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-200 mb-3">Testing Checklist</h4>
                <ul className="space-y-2">
                  {data.checklist.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-cyan-400 font-bold mt-0.5">☐</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.references && data.references.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-200 mb-3">References</h4>
                <div className="space-y-2">
                  {data.references.map((ref: string, i: number) => (
                    <a
                      key={i}
                      href={ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-cyan-400 hover:text-cyan-300 break-all"
                    >
                      {ref}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            No data available for this category
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
