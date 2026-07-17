"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import type { AuthUser, UpdateProfileInput } from "@/entities/auth/types";
import { ApiError } from "@/shared/api/http";
import { classNames } from "@/shared/lib/classNames";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { Modal } from "@/shared/ui/Modal";
import { AccountIcon } from "@/shared/ui/icons/AccountIcon";
import { CameraIcon } from "@/shared/ui/icons/CameraIcon";

type ProfileModalProps = {
  onClose: () => void;
  onSave: (input: UpdateProfileInput) => Promise<void>;
  user: AuthUser;
};

function ProfileAvatar({
  previewUrl,
  user,
}: {
  previewUrl: string | null;
  user: AuthUser;
}) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const avatarUrl = previewUrl ?? user.avatarUrl;

  if (!avatarUrl || failedAvatarUrl === avatarUrl) {
    return (
      <span className="flex size-28 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <AccountIcon className="size-16" />
      </span>
    );
  }

  return (
    // Avatar URLs can be from Google or Supabase Storage and do not use Next image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className="size-28 rounded-full object-cover"
      onError={() => setFailedAvatarUrl(avatarUrl)}
      src={avatarUrl}
    />
  );
}

export function ProfileModal({ onClose, onSave, user }: ProfileModalProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [name, setName] = useState(user.name ?? "");
  const [avatar, setAvatar] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const trimmedName = name.trim();
  const isUnchanged = trimmedName === (user.name?.trim() ?? "") && !avatar;

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    [],
  );

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const nextAvatar = event.target.files?.[0];

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreviewUrl = nextAvatar ? URL.createObjectURL(nextAvatar) : null;
    previewUrlRef.current = nextPreviewUrl;
    setAvatar(nextAvatar);
    setPreviewUrl(nextPreviewUrl);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedName || isUnchanged) {
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onSave({ avatar, name: trimmedName });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Could not save your profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      className="max-w-md"
      onClose={onClose}
      showCloseButton={false}
      title="Edit profile"
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="flex justify-center pt-2">
          <div className="relative">
            <ProfileAvatar previewUrl={previewUrl} user={user} />
            <input
              ref={avatarInputRef}
              accept="image/jpeg,image/png,image/webp"
              aria-label="Choose profile picture"
              className="sr-only"
              onChange={handleAvatarChange}
              type="file"
            />
            <button
              aria-label="Change profile picture"
              className="absolute right-0 bottom-0 inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-sm hover:bg-hover-overlay"
              onClick={() => avatarInputRef.current?.click()}
              type="button"
            >
              <CameraIcon className="size-5" />
            </button>
          </div>
        </div>

        <label className="grid gap-2 text-base text-foreground">
          <span>Display name</span>
          <input
            autoComplete="name"
            className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground"
            maxLength={80}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            required
            value={name}
          />
        </label>

        <div className="grid gap-2 text-base">
          <span className="text-foreground">Email</span>
          <p className="rounded-xl border border-border bg-muted px-4 py-3 text-muted-foreground">
            {user.email}
          </p>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <button
            className={secondaryTextButtonClassName()}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={classNames(
              primaryTextButtonClassName(),
              "min-w-20",
            )}
            disabled={isSaving || !trimmedName || isUnchanged}
            type="submit"
          >
            {isSaving ? "Saving" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
