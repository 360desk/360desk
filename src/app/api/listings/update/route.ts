import { NextResponse, type NextRequest } from "next/server";
import { updateClassifiedAd } from "@/lib/supabase/ads";
import { buildListingLocationColumns } from "@/lib/supabase/listing-location-payload";
import { createClient } from "@/lib/supabase/server";
import type { CategorySelection } from "@/lib/categories";
import type { DynamicProperties } from "@/types/dynamic-properties";
import type { AdSaveMode } from "@/lib/supabase/ads";

interface ListingUpdateRequestBody {
  id: string;
  mode?: AdSaveMode;
  title: string;
  description: string | null;
  price: number;
  category: CategorySelection;
  contact_phone: string | null;
  images: string[];
  dynamic_properties: DynamicProperties;
  city_id?: string | null;
  district_id?: string | null;
  neighborhood_id?: string | null;
  full_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  tasinmaz_no?: string | null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." },
      { status: 401 }
    );
  }

  let body: ListingUpdateRequestBody;

  try {
    body = (await request.json()) as ListingUpdateRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi." },
      { status: 400 }
    );
  }

  if (!body.id?.trim()) {
    return NextResponse.json(
      { error: "İlan kimliği zorunludur." },
      { status: 400 }
    );
  }

  const locationColumns = buildListingLocationColumns({
    city_id: body.city_id,
    district_id: body.district_id,
    neighborhood_id: body.neighborhood_id,
    full_address: body.full_address,
    latitude: body.latitude,
    longitude: body.longitude,
  });

  const mode: AdSaveMode = body.mode === "draft" ? "draft" : "publish";

  const { error } = await updateClassifiedAd(
    supabase,
    {
      id: body.id,
      title: body.title,
      description: body.description,
      price: body.price,
      category: body.category,
      contact_phone: body.contact_phone,
      images: body.images,
      dynamic_properties: body.dynamic_properties,
      tasinmaz_no: body.tasinmaz_no,
      ...locationColumns,
    },
    mode,
    user.id
  );

  if (error) {
    console.log("[listing-update] api response error", {
      authenticatedUserId: user.id,
      listingId: body.id,
      error,
    });

    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
