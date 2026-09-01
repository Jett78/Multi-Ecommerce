"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuPopup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCrud } from "@/hooks/useCRUD";
import { showError } from "@/lib/toast-helper";

interface DataTableActionsProps {
  editHref?: string;
  viewHref?: string;
  onViewClick?: () => void;
  deleteId?: string;
  deleteEndpoint?: string;
  deleteQueryKey?: string;
  deleteEntityName?: string;
  onDeleteSuccess?: () => Promise<void> | void;
  hideEdit?: boolean;
  hideDelete?: boolean;
}

export function DataTableActions({
  editHref,
  viewHref,
  onViewClick,
  deleteId,
  deleteEndpoint,
  deleteQueryKey,
  deleteEntityName = "item",
  onDeleteSuccess,
  hideEdit = false,
  hideDelete = false,
}: DataTableActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { remove } = useCrud({
    endpoint: deleteEndpoint || "",
    queryKey: deleteQueryKey || "",
    isAuthenticated: true,
  });

  const handleDelete = async () => {
    if (!deleteId || !deleteEndpoint) return;
    remove.mutate(deleteId, {
      onSuccess: async (res: unknown) => {
        if (res && typeof res === "object" && "success" in res && res.success) {
          if (onDeleteSuccess) {
            await onDeleteSuccess();
          }
          setConfirmOpen(false);
          router.refresh();
        }
      },
      onError: (error: Error) => {
        showError(error.message || `Failed to delete ${deleteEntityName}`);
        setConfirmOpen(false);
      },
    });
  };

  const hasEdit = editHref && !hideEdit;
  const hasDelete = deleteId && deleteEndpoint && !hideDelete;
  const hasView = viewHref || onViewClick;

  if (!hasEdit && !hasDelete && !hasView) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center gap-2 h-8 w-8 rounded-md text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuPositioner side="bottom" align="end" sideOffset={4}>
            <DropdownMenuPopup>
              {hasView && (
                <DropdownMenuItem
                  onClick={onViewClick}
                  render={viewHref ? <Link href={viewHref} /> : undefined}
                >
                  <Eye className="size-4" />
                  View
                </DropdownMenuItem>
              )}
              {hasEdit && (
                <DropdownMenuItem render={<Link href={editHref} />}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {(hasView || hasEdit) && hasDelete && <DropdownMenuSeparator />}
              {hasDelete && (
                <DropdownMenuItem
                  onClick={() => setConfirmOpen(true)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuPopup>
          </DropdownMenuPositioner>
        </DropdownMenuPortal>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteEntityName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={remove.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {remove.isPending ? "Deleting..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
