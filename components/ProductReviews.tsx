"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type ReviewUser = string | { _id: string; name?: string };

type ProductReview = {
  _id?: string;
  user: ReviewUser;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
};

type ReviewWithKey = ProductReview & {
  clientKey: string;
};

type ReviewErrors = {
  rating?: string;
  comment?: string;
  general?: string;
};

type ApiErrorResponse = {
  field?: string;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  review?: ProductReview;
  rating?: number;
  numReviews?: number;
};

type ProductReviewsProps = {
  productId: string;
  initialRating: number;
  initialNumReviews: number;
  initialReviews: ProductReview[];
  currentUserId: string | null;
};

function getReviewUserId(user: ReviewUser): string {
  return typeof user === "string" ? user : user._id;
}

function createReviewKey(review: ProductReview, index: number): string {
  if (review._id) {
    return String(review._id);
  }

  const userId = getReviewUserId(review.user);

  return `${userId}-${review.createdAt}-${review.comment.slice(0, 40)}-${index}`;
}

function formatReviewDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function parseResponse(text: string): ApiErrorResponse {
  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as ApiErrorResponse;
  } catch {
    return {
      error: "The review service returned an invalid response.",
    };
  }
}

function getResponseMessage(
  response: Response,
  data: ApiErrorResponse,
): string {
  return (
    data.message ||
    data.error ||
    `The request failed with status ${response.status}.`
  );
}

export default function ProductReviews({
  productId,
  initialRating,
  initialNumReviews,
  initialReviews,
  currentUserId,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewWithKey[]>(
    initialReviews.map((review, index) => ({
      ...review,
      clientKey: createReviewKey(review, index),
    })),
  );

  const [averageRating, setAverageRating] = useState(initialRating);
  const [numReviews, setNumReviews] = useState(initialNumReviews);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const [errors, setErrors] = useState<ReviewErrors>({});
  const [editErrors, setEditErrors] = useState<ReviewErrors>({});

  const alreadyReviewed = useMemo(() => {
    if (!currentUserId) return false;

    return reviews.some(
      (review) => getReviewUserId(review.user) === currentUserId,
    );
  }, [currentUserId, reviews]);

  const clearError = (field: keyof ReviewErrors) => {
    setErrors((previous) => {
      if (!previous[field]) return previous;

      const nextErrors = { ...previous };
      delete nextErrors[field];

      return nextErrors;
    });
  };

  const clearEditError = (field: keyof ReviewErrors) => {
    setEditErrors((previous) => {
      if (!previous[field]) return previous;

      const nextErrors = { ...previous };
      delete nextErrors[field];

      return nextErrors;
    });
  };

  const validateReview = (
    selectedRating: number,
    reviewComment: string,
  ): ReviewErrors => {
    const nextErrors: ReviewErrors = {};

    if (
      !Number.isInteger(selectedRating) ||
      selectedRating < 1 ||
      selectedRating > 5
    ) {
      nextErrors.rating = "Please select a rating from 1 to 5 stars.";
    }

    if (!reviewComment.trim()) {
      nextErrors.comment = "A review comment is required.";
    } else if (reviewComment.trim().length < 2) {
      nextErrors.comment = "Your review comment must be at least 2 characters.";
    } else if (reviewComment.trim().length > 1000) {
      nextErrors.comment = "Your review comment cannot exceed 1000 characters.";
    }

    return nextErrors;
  };

  const updateSummary = (data: ApiErrorResponse) => {
    if (typeof data.rating === "number") {
      setAverageRating(data.rating);
    }

    if (typeof data.numReviews === "number") {
      setNumReviews(data.numReviews);
    }
  };

  const applyApiErrors = (
    data: ApiErrorResponse,
    setTargetErrors: (value: ReviewErrors) => void,
  ) => {
    if (data.fieldErrors) {
      setTargetErrors({
        rating: data.fieldErrors.rating,
        comment: data.fieldErrors.comment,
        general: data.fieldErrors.general,
      });
      return;
    }

    if (data.field === "rating") {
      setTargetErrors({
        rating: data.message || "Invalid rating.",
      });
      return;
    }

    if (data.field === "comment") {
      setTargetErrors({
        comment: data.message || "Invalid comment.",
      });
      return;
    }

    setTargetErrors({
      general: data.message || data.error || "Unable to complete this request.",
    });
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateReview(rating, comment);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/api/product/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      const responseText = await response.text();
      const data = parseResponse(responseText);

      if (!response.ok) {
        applyApiErrors(data, setErrors);
        throw new Error(getResponseMessage(response, data));
      }

      if (!data.review) {
        throw new Error(
          "Review was saved, but the server did not return the new review.",
        );
      }

      setReviews((previous) => {
        const newReview = data.review as ProductReview;

        const reviewWithKey: ReviewWithKey = {
          _id: newReview._id,
          user: newReview.user,
          name: newReview.name,
          rating: newReview.rating,
          comment: newReview.comment,
          createdAt: newReview.createdAt,
          updatedAt: newReview.updatedAt,
          clientKey: createReviewKey(newReview, previous.length),
        };

        return [reviewWithKey, ...previous];
      });

      updateSummary(data);
      setRating(0);
      setComment("");

      toast.success("Review submitted successfully!");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your review.",
      );
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (review: ReviewWithKey) => {
    if (!review._id) {
      toast.error("This review cannot be edited because it has no ID.");
      return;
    }

    setEditingReviewId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditErrors({});
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment("");
    setEditErrors({});
  };

  const saveReviewEdit = async (
    event: FormEvent<HTMLFormElement>,
    reviewId: string,
  ) => {
    event.preventDefault();

    const nextErrors = validateReview(editRating, editComment);

    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSavingEdit(true);
    setEditErrors({});

    try {
      const response = await fetch(
        `/api/product/${productId}/reviews/${reviewId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            rating: editRating,
            comment: editComment.trim(),
          }),
        },
      );

      const responseText = await response.text();
      const data = parseResponse(responseText);

      if (!response.ok) {
        applyApiErrors(data, setEditErrors);
        throw new Error(getResponseMessage(response, data));
      }

      if (!data.review) {
        throw new Error(
          "Review was updated, but the server did not return it.",
        );
      }

      const updatedReview = data.review;

      setReviews((previous) =>
        previous.map((review) =>
          review._id === reviewId
            ? {
                ...review,
                rating: updatedReview.rating,
                comment: updatedReview.comment,
                updatedAt: updatedReview.updatedAt,
              }
            : review,
        ),
      );

      updateSummary(data);
      cancelEditing();

      toast.success("Review updated successfully!");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating your review.",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteReview = async (reviewId?: string) => {
    if (!reviewId) {
      toast.error("This review cannot be deleted because it has no ID.");
      return;
    }

    const confirmed = window.confirm(
      "Delete your review? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingReviewId(reviewId);

    try {
      const response = await fetch(
        `/api/product/${productId}/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const responseText = await response.text();
      const data = parseResponse(responseText);

      if (!response.ok) {
        throw new Error(getResponseMessage(response, data));
      }

      setReviews((previous) =>
        previous.filter((review) => review._id !== reviewId),
      );

      updateSummary(data);

      if (editingReviewId === reviewId) {
        cancelEditing();
      }

      toast.success("Review deleted successfully!");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting your review.",
      );
    } finally {
      setDeletingReviewId(null);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">
          Customer feedback
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
          Reviews
        </h2>

        <div className="mt-5 flex items-end gap-3">
          <p className="text-5xl font-bold text-slate-900 dark:text-white">
            {averageRating > 0 ? averageRating.toFixed(1) : "—"}
          </p>

          <div className="pb-1">
            <div
              className="flex text-lg"
              aria-label={`${averageRating.toFixed(1)} out of 5 stars`}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  aria-hidden="true"
                  className={
                    star <= Math.round(averageRating)
                      ? "text-amber-400"
                      : "text-slate-300 dark:text-slate-700"
                  }
                >
                  ★
                </span>
              ))}
            </div>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Based on {numReviews} {numReviews === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>

        {!currentUserId ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Share your experience
            </h3>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Sign in to leave a rating and review.
            </p>

            <Link
              href="/signin"
              className="mt-4 inline-flex rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600"
            >
              Sign in to review
            </Link>
          </div>
        ) : alreadyReviewed ? (
          <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-5 text-sm text-teal-800 dark:border-teal-900/70 dark:bg-teal-950/30 dark:text-teal-200">
            You have already reviewed this product. You can edit or delete it
            from the review list.
          </div>
        ) : (
          <form
            onSubmit={submitReview}
            className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900"
            noValidate
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Write a review
            </h3>

            {errors.general && (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
              >
                {errors.general}
              </p>
            )}

            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Your rating <span className="text-red-600">*</span>
              </legend>

              <div
                className="mt-2 flex gap-1"
                role="radiogroup"
                aria-invalid={Boolean(errors.rating)}
                aria-describedby={
                  errors.rating ? "review-rating-error" : undefined
                }
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      clearError("rating");
                    }}
                    className={`rounded p-1 text-3xl transition focus:outline-none focus:ring-4 focus:ring-teal-500/20 ${
                      star <= rating
                        ? "text-amber-400"
                        : "text-slate-300 hover:text-amber-300 dark:text-slate-700"
                    }`}
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {errors.rating && (
                <p
                  id="review-rating-error"
                  className="mt-1 text-sm font-medium text-red-600 dark:text-red-400"
                >
                  {errors.rating}
                </p>
              )}
            </fieldset>

            <div className="mt-5">
              <label
                htmlFor="review-comment"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Review <span className="text-red-600">*</span>
              </label>

              <textarea
                id="review-comment"
                required
                minLength={2}
                maxLength={1000}
                rows={5}
                value={comment}
                onChange={(event) => {
                  setComment(event.target.value);
                  clearError("comment");
                }}
                placeholder="What did you think of this product?"
                className={`mt-2 w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition dark:bg-slate-950 dark:text-white ${
                  errors.comment
                    ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700"
                }`}
                aria-invalid={Boolean(errors.comment)}
                aria-describedby={
                  errors.comment ? "review-comment-error" : undefined
                }
              />

              <div className="mt-1 flex items-center justify-between gap-3">
                {errors.comment ? (
                  <p
                    id="review-comment-error"
                    className="text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {errors.comment}
                  </p>
                ) : (
                  <span />
                )}

                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {comment.length}/1000
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Submitting review..." : "Submit review"}
            </button>
          </form>
        )}
      </section>

      <section>
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
            No reviews yet. Be the first to share your experience.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const isOwnReview =
                currentUserId !== null &&
                getReviewUserId(review.user) === currentUserId;

              const isEditing =
                Boolean(review._id) && editingReviewId === review._id;

              return (
                <article
                  key={review.clientKey}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {review.name}
                      </h3>

                      {!isEditing && (
                        <div
                          className="mt-1 flex text-sm"
                          aria-label={`${review.rating} out of 5 stars`}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              aria-hidden="true"
                              className={
                                star <= review.rating
                                  ? "text-amber-400"
                                  : "text-slate-300 dark:text-slate-700"
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <time className="text-xs text-slate-500 dark:text-slate-400">
                        {formatReviewDate(review.createdAt)}
                      </time>

                      {isOwnReview && !isEditing && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(review)}
                            className="text-xs font-semibold text-teal-600 underline underline-offset-2 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteReview(review._id)}
                            disabled={deletingReviewId === review._id}
                            className="text-xs font-semibold text-red-600 underline underline-offset-2 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                          >
                            {deletingReviewId === review._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && review._id ? (
                    <form
                      onSubmit={(event) => saveReviewEdit(event, review._id!)}
                      className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-950"
                      noValidate
                    >
                      {editErrors.general && (
                        <p
                          role="alert"
                          className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
                        >
                          {editErrors.general}
                        </p>
                      )}

                      <fieldset>
                        <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Your rating
                        </legend>

                        <div
                          className="mt-2 flex gap-1"
                          role="radiogroup"
                          aria-invalid={Boolean(editErrors.rating)}
                          aria-describedby={
                            editErrors.rating
                              ? `edit-rating-error-${review._id}`
                              : undefined
                          }
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => {
                                setEditRating(star);
                                clearEditError("rating");
                              }}
                              className={`rounded p-1 text-3xl transition focus:outline-none focus:ring-4 focus:ring-teal-500/20 ${
                                star <= editRating
                                  ? "text-amber-400"
                                  : "text-slate-300 hover:text-amber-300 dark:text-slate-700"
                              }`}
                              role="radio"
                              aria-checked={editRating === star}
                              aria-label={`${star} star${
                                star === 1 ? "" : "s"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>

                        {editErrors.rating && (
                          <p
                            id={`edit-rating-error-${review._id}`}
                            className="mt-1 text-sm font-medium text-red-600 dark:text-red-400"
                          >
                            {editErrors.rating}
                          </p>
                        )}
                      </fieldset>

                      <div className="mt-4">
                        <label
                          htmlFor={`edit-comment-${review._id}`}
                          className="text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                          Review
                        </label>

                        <textarea
                          id={`edit-comment-${review._id}`}
                          rows={4}
                          minLength={2}
                          maxLength={1000}
                          value={editComment}
                          onChange={(event) => {
                            setEditComment(event.target.value);
                            clearEditError("comment");
                          }}
                          className={`mt-2 w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition dark:bg-slate-900 dark:text-white ${
                            editErrors.comment
                              ? "border-red-500 ring-2 ring-red-500/15 focus:border-red-500 focus:ring-red-500/20"
                              : "border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700"
                          }`}
                          aria-invalid={Boolean(editErrors.comment)}
                          aria-describedby={
                            editErrors.comment
                              ? `edit-comment-error-${review._id}`
                              : undefined
                          }
                        />

                        <div className="mt-1 flex items-center justify-between gap-3">
                          {editErrors.comment ? (
                            <p
                              id={`edit-comment-error-${review._id}`}
                              className="text-sm font-medium text-red-600 dark:text-red-400"
                            >
                              {editErrors.comment}
                            </p>
                          ) : (
                            <span />
                          )}

                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {editComment.length}/1000
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={savingEdit}
                          className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingEdit ? "Saving..." : "Save changes"}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={savingEdit}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {review.comment}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
