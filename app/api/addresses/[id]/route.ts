import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Types } from "mongoose";

import { auth } from "@/lib/auth";
import db from "@/utils/db";
import Address from "@/models/Address";

type AddressPayload = {
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

const serializeAddress = (address: {
  _id: Types.ObjectId;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) => ({
  _id: String(address._id),
  label: address.label,
  fullName: address.fullName,
  phone: address.phone,
  street: address.street,
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
  country: address.country,
  isDefault: Boolean(address.isDefault),
  createdAt: address.createdAt,
  updatedAt: address.updatedAt,
});

const getSessionUserId = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;

  if (!userId || !Types.ObjectId.isValid(userId)) {
    return null;
  }

  return new Types.ObjectId(userId);
};

const normalizeAddress = (body: Partial<AddressPayload>) => ({
  label: String(body.label || "").trim(),
  fullName: String(body.fullName || "").trim(),
  phone: String(body.phone || "").trim(),
  street: String(body.street || "").trim(),
  city: String(body.city || "").trim(),
  state: String(body.state || "").trim(),
  postalCode: String(body.postalCode || "").trim(),
  country: String(body.country || "").trim(),
  isDefault: Boolean(body.isDefault),
});

const validateAddress = (address: ReturnType<typeof normalizeAddress>) => {
  if (!address.label) return "Please provide an address label.";
  if (address.label.length > 50) return "Address label is too long.";
  if (!address.fullName) return "Please provide a full name.";
  if (!address.phone) return "Please provide a phone number.";
  if (!address.street || address.street.length < 3) {
    return "Please provide a valid street address.";
  }
  if (!address.city) return "Please provide a city.";
  if (!address.state) return "Please provide a state or region.";
  if (!address.postalCode) return "Please provide a postal code.";
  if (!address.country) return "Please provide a country.";

  return null;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid address ID." },
        { status: 400 },
      );
    }

    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Partial<AddressPayload>;
    const addressData = normalizeAddress(body);
    const validationError = validateAddress(addressData);

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 },
      );
    }

    await db.connect();

    const address = await Address.findOne({
      _id: new Types.ObjectId(id),
      userId,
    });

    if (!address) {
      return NextResponse.json(
        { message: "Address not found." },
        { status: 404 },
      );
    }

    if (addressData.isDefault) {
      await Address.updateMany(
        {
          userId,
          _id: {
            $ne: address._id,
          },
        },
        {
          $set: {
            isDefault: false,
          },
        },
      );
    }

    address.label = addressData.label;
    address.fullName = addressData.fullName;
    address.phone = addressData.phone;
    address.street = addressData.street;
    address.city = addressData.city;
    address.state = addressData.state;
    address.postalCode = addressData.postalCode;
    address.country = addressData.country;
    address.isDefault = addressData.isDefault;

    await address.save();

    return NextResponse.json({
      address: serializeAddress(address.toObject()),
    });
  } catch (error) {
    console.error("Failed to update address:", error);

    return NextResponse.json(
      { message: "Failed to update address." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid address ID." },
        { status: 400 },
      );
    }

    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 },
      );
    }

    await db.connect();

    const deletedAddress = await Address.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId,
    });

    if (!deletedAddress) {
      return NextResponse.json(
        { message: "Address not found." },
        { status: 404 },
      );
    }

    if (deletedAddress.isDefault) {
      const replacement = await Address.findOne({ userId }).sort({
        updatedAt: -1,
      });

      if (replacement) {
        replacement.isDefault = true;
        await replacement.save();
      }
    }

    return NextResponse.json({
      message: "Address deleted.",
    });
  } catch (error) {
    console.error("Failed to delete address:", error);

    return NextResponse.json(
      { message: "Failed to delete address." },
      { status: 500 },
    );
  }
}