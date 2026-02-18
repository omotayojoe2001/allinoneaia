import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const countries = [
  { code: "234", name: "Nigeria", flag: "🇳🇬" },
  { code: "1", name: "USA/Canada", flag: "🇺🇸" },
  { code: "44", name: "UK", flag: "🇬🇧" },
  { code: "91", name: "India", flag: "🇮🇳" },
  { code: "86", name: "China", flag: "🇨🇳" },
  { code: "27", name: "South Africa", flag: "🇿🇦" },
  { code: "254", name: "Kenya", flag: "🇰🇪" },
  { code: "233", name: "Ghana", flag: "🇬🇭" },
];

export function PhoneInput({ value, onChange, placeholder }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState("234");
  
  const phoneNumber = value.replace(/^\d{1,3}/, "");
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/\D/g, "");
    onChange(countryCode + num);
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    onChange(code + phoneNumber);
  };

  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.flag} +{c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder || "8012345678"}
        className="flex-1"
      />
    </div>
  );
}
