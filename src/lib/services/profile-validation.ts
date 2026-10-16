/**
 * ONE STORE: Customer Profile & Address Validation Engine
 * Enforces 100% complete profile verification before checkout, orders, or payments.
 */

export interface ProfileInput {
  full_name?: string | null;
  email?: string | null;
  is_email_verified?: boolean;
  phone?: string | null;
  is_phone_verified?: boolean;
  country?: string | null;
  preferred_currency?: string | null;
  apartment_unit?: string | null;
  street_address?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  delivery_instructions?: string | null;
}

export interface AddressInput {
  id?: string;
  recipient_name?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  is_default?: boolean;
  label?: string | null;
}

export interface ChecklistItem {
  id: string;
  label: string;
  weight: number;
  completed: boolean;
  error?: string;
}

export interface ProfileValidationResult {
  isComplete: boolean;
  percentage: number;
  missingFields: string[];
  fieldErrors: Record<string, string>;
  checklist: ChecklistItem[];
}

/**
 * Validates country-specific postal / PIN codes:
 * - India: 6-digit numeric PIN code (e.g., 400001, 110001)
 * - UK: Royal Mail outward & inward postcode (e.g., SW1A 1AA, EC1A 1BB, M1 1AE)
 */
export function validatePostalCode(code: string | null | undefined, country: "IN" | "GB" = "IN"): boolean {
  if (!code) return false;
  const clean = code.trim();
  if (country === "GB") {
    // UK Postcode regex: standard format 1-2 letters, 1-2 numbers/alphanumeric, space, 1 number, 2 letters
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    return ukPostcodeRegex.test(clean);
  }
  // India PIN code: exactly 6 digits, does not start with 0
  const inPinRegex = /^[1-9][0-9]{5}$/;
  return inPinRegex.test(clean);
}

/**
 * Validates country-specific mobile phone numbers:
 * - India: 10-digit mobile starting with 6, 7, 8, or 9 (with optional +91 or 0 prefix)
 * - UK: 10 or 11 digit mobile starting with 07 or +447
 */
export function validatePhoneNumber(phone: string | null | undefined, country: "IN" | "GB" = "IN"): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\(\)]/g, "");

  if (country === "GB") {
    // UK mobile: +447xxx or 07xxx (total digits without prefix = 10)
    if (/^\+447\d{9}$/.test(clean)) return true;
    if (/^07\d{9}$/.test(clean)) return true;
    if (/^7\d{9}$/.test(clean)) return true;
    return false;
  }

  // India mobile: 10 digits starting 6-9
  if (/^\+91[6-9]\d{9}$/.test(clean)) return true;
  if (/^91[6-9]\d{9}$/.test(clean)) return true;
  if (/^0[6-9]\d{9}$/.test(clean)) return true;
  if (/^[6-9]\d{9}$/.test(clean)) return true;
  return false;
}

/**
 * Validates an email address syntax
 */
export function validateEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Calculates 100% profile completion score and returns missing fields.
 * If user has saved addresses in the address book, address fields are checked against both profile & addresses.
 */
export function calculateProfileCompletion(
  profile: ProfileInput | null | undefined,
  addresses?: AddressInput[] | null
): ProfileValidationResult {
  const p = profile || {};
  const country: "IN" | "GB" = p.country === "GB" ? "GB" : "IN";

  // Check if user has a valid default saved address from address book
  const defaultAddress = addresses?.find((a) => a.is_default) || addresses?.[0];

  // Effective address values (combines profile direct columns or saved address book)
  const effectiveLine1 = (p.apartment_unit || "") + (p.street_address ? ` ${p.street_address}` : "") || defaultAddress?.line1 || "";
  const effectiveCity = p.city || defaultAddress?.city || "";
  const effectiveState = p.state_or_province || defaultAddress?.state_or_province || "";
  const effectivePostal = p.postal_code || defaultAddress?.postal_code || "";
  const effectiveCountry: "IN" | "GB" =
    (defaultAddress?.country_code === "GB" || p.country === "GB") ? "GB" : "IN";
  const effectivePhone = p.phone || defaultAddress?.phone || "";

  const fieldErrors: Record<string, string> = {};
  const missingFields: string[] = [];

  // 1. Full Legal Name (15%)
  const hasValidName = !!p.full_name && p.full_name.trim().length >= 3;
  if (!hasValidName) {
    fieldErrors.full_name = "Full legal name is required (min 3 characters).";
    missingFields.push("Full legal name");
  }

  // 2. Verified Email (15%)
  const hasValidEmail = validateEmail(p.email) && p.is_email_verified !== false;
  if (!hasValidEmail) {
    fieldErrors.email = "A verified email address is required.";
    missingFields.push("Verified email address");
  }

  // 3. Mobile Phone Number (15%)
  const hasValidPhone = validatePhoneNumber(effectivePhone, country);
  if (!hasValidPhone) {
    fieldErrors.phone = country === "IN" 
      ? "Valid 10-digit Indian mobile number is required (e.g. +91 98765 43210)."
      : "Valid UK mobile number is required (e.g. +44 7911 123456).";
    missingFields.push("Mobile phone number");
  }

  // 4. Street & Apartment / House address (20%)
  const hasValidLine1 = effectiveLine1.trim().length >= 5;
  if (!hasValidLine1) {
    fieldErrors.street_address = "Complete street, house, or apartment address is required.";
    missingFields.push("Delivery street address");
  }

  // 5. City or Town (10%)
  const hasValidCity = effectiveCity.trim().length >= 2;
  if (!hasValidCity) {
    fieldErrors.city = "City or town is required.";
    missingFields.push("City or town");
  }

  // 6. State, Province, or Region (10%)
  const hasValidState = effectiveState.trim().length >= 2;
  if (!hasValidState) {
    fieldErrors.state_or_province = "State, province, or region is required.";
    missingFields.push("State or province");
  }

  // 7. Country-specific Postal / PIN Code (15%)
  const hasValidPostal = validatePostalCode(effectivePostal, effectiveCountry);
  if (!hasValidPostal) {
    fieldErrors.postal_code = effectiveCountry === "IN"
      ? "Valid 6-digit Indian PIN code is required (e.g. 400001)."
      : "Valid UK alphanumeric postcode is required (e.g. SW1A 1AA).";
    missingFields.push("Postal / PIN code");
  }

  const checklist: ChecklistItem[] = [
    {
      id: "full_name",
      label: "Full legal name",
      weight: 15,
      completed: hasValidName,
      error: fieldErrors.full_name,
    },
    {
      id: "email",
      label: "Verified email address",
      weight: 15,
      completed: hasValidEmail,
      error: fieldErrors.email,
    },
    {
      id: "phone",
      label: "Mobile phone number",
      weight: 15,
      completed: hasValidPhone,
      error: fieldErrors.phone,
    },
    {
      id: "street_address",
      label: "Apartment & street address",
      weight: 20,
      completed: hasValidLine1,
      error: fieldErrors.street_address,
    },
    {
      id: "city",
      label: "City or town",
      weight: 10,
      completed: hasValidCity,
      error: fieldErrors.city,
    },
    {
      id: "state_or_province",
      label: "State or province",
      weight: 10,
      completed: hasValidState,
      error: fieldErrors.state_or_province,
    },
    {
      id: "postal_code",
      label: "Postal / PIN code",
      weight: 15,
      completed: hasValidPostal,
      error: fieldErrors.postal_code,
    },
  ];

  const percentage = checklist.reduce((sum, item) => (item.completed ? sum + item.weight : sum), 0);
  const isComplete = percentage === 100;

  return {
    isComplete,
    percentage,
    missingFields,
    fieldErrors,
    checklist,
  };
}

/**
 * Checks all checkout prerequisites:
 * 1. User authenticated
 * 2. Email verified
 * 3. Profile 100% complete
 * 4. Valid delivery address
 */
export function validateCheckoutPrerequisites(
  isAuthenticated: boolean,
  profile: ProfileInput | null | undefined,
  addresses?: AddressInput[] | null
): { allowed: boolean; reason?: string; missingFields?: string[]; percentage: number } {
  if (!isAuthenticated) {
    return {
      allowed: false,
      reason: "Authentication required. Please sign in or register to proceed with checkout.",
      percentage: 0,
    };
  }

  if (!profile) {
    return {
      allowed: false,
      reason: "Customer profile not found. Please complete your profile to continue.",
      percentage: 0,
      missingFields: ["Customer profile"],
    };
  }

  const completion = calculateProfileCompletion(profile, addresses);

  if (!completion.isComplete) {
    return {
      allowed: false,
      reason: `Profile completion is ${completion.percentage}%. 100% complete profile is mandatory before checkout. Missing: ${completion.missingFields.join(", ")}.`,
      missingFields: completion.missingFields,
      percentage: completion.percentage,
    };
  }

  return {
    allowed: true,
    percentage: 100,
  };
}
