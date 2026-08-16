"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type SavedAddress = {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type AddressForm = Omit<SavedAddress, "_id">;

const emptyForm: AddressForm = {
  label: "",
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  isDefault: false,
};

export default function MyAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);

  const loadAddresses = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/addresses", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load addresses.");
      }

      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load addresses.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openCreateForm = () => {
    setEditingAddress(null);
    setForm({
      ...emptyForm,
      isDefault: addresses.length === 0,
    });
    setShowForm(true);
  };

  const openEditForm = (address: SavedAddress) => {
    setEditingAddress(address);
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAddress(null);
    setForm(emptyForm);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);

      const isEditing = Boolean(editingAddress);

      const response = await fetch(
        isEditing ? `/api/addresses/${editingAddress?._id}` : "/api/addresses",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save address.");
      }

      const savedAddress = data.address as SavedAddress;

      setAddresses((previous) => {
        const withoutSavedAddress = previous
          .filter((address) => address._id !== savedAddress._id)
          .map((address) => ({
            ...address,
            isDefault: savedAddress.isDefault ? false : address.isDefault,
          }));

        return [savedAddress, ...withoutSavedAddress].sort(
          (first, second) => Number(second.isDefault) - Number(first.isDefault),
        );
      });

      toast.success(isEditing ? "Address updated." : "Address saved.");
      closeForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save address.",
      );
    } finally {
      setSaving(false);
    }
  };

  const setDefaultAddress = async (address: SavedAddress) => {
    if (address.isDefault) {
      return;
    }

    try {
      const response = await fetch(`/api/addresses/${address._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...address,
          isDefault: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to set default address.");
      }

      const savedAddress = data.address as SavedAddress;

      setAddresses((previous) =>
        previous
          .map((item) => ({
            ...item,
            isDefault: item._id === savedAddress._id,
          }))
          .sort(
            (first, second) =>
              Number(second.isDefault) - Number(first.isDefault),
          ),
      );

      toast.success("Default address updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to set default address.",
      );
    }
  };

  const deleteAddress = async (address: SavedAddress) => {
    const confirmed = window.confirm(`Delete the "${address.label}" address?`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(address._id);

      const response = await fetch(`/api/addresses/${address._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete address.");
      }

      setAddresses((previous) =>
        previous.filter((item) => item._id !== address._id),
      );

      toast.success("Address deleted.");

      // Reload in case the API promoted a replacement address to default.
      await loadAddresses();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete address.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
        Loading addresses...
      </p>
    );
  }

  return (
    <div className="mt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Save addresses for faster checkout. Changes here do not modify
          shipping addresses on past orders.
        </p>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Add Address
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900/50 dark:bg-teal-950/20"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">
              {editingAddress ? "Edit Address" : "New Address"}
            </h3>

            <button
              type="button"
              onClick={closeForm}
              className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close address form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AddressInput
              label="Label"
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="Home, Office, etc."
            />

            <AddressInput
              label="Full Name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
            />

            <AddressInput
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              inputMode="tel"
            />

            <AddressInput
              label="Street Address"
              name="street"
              value={form.street}
              onChange={handleChange}
            />

            <AddressInput
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
            />

            <AddressInput
              label="State / Region"
              name="state"
              value={form.state}
              onChange={handleChange}
            />

            <AddressInput
              label="Postal Code"
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
            />

            <AddressInput
              label="Country"
              name="country"
              value={form.country}
              onChange={handleChange}
            />
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleChange}
              className="h-4 w-4 accent-teal-600"
            />
            Make this my default shipping address
          </label>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingAddress
                  ? "Save Changes"
                  : "Save Address"}
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">
          No saved addresses yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <article
              key={address._id}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {address.label}
                    </h3>

                    {address.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        <Star className="h-3 w-3" />
                        Default
                      </span>
                    )}
                  </div>

                  <address className="mt-3 not-italic text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <p>{address.fullName}</p>
                    <p>{address.street}</p>
                    <p>
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p>{address.country}</p>
                    <p>{address.phone}</p>
                  </address>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEditForm(address)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>

                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefaultAddress(address)}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-950/20"
                  >
                    <Star className="h-4 w-4" />
                    Set Default
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => deleteAddress(address)}
                  disabled={deletingId === address._id}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === address._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function AddressInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  name: keyof AddressForm;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        required
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-600 dark:bg-slate-900"
      />
    </label>
  );
}
