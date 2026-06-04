"use client";

import { useEffect, useState } from "react";
import { Car, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

const initialFormData = {
  request_type: "official",
  vehicle_nature: "university_owned",
  number_of_persons: "",
  travel_date_from: "",
  travel_date_to: "",
  required_time_from: "",
  required_time_to: "",
  purpose: "",
  places_to_visit: "",
  travel_route: "",
  distance_type: "short",
  special_notes: "",
};

const ACCEPTED_FILE_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export function VehicleReservationForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approverType, setApproverType] = useState("DEAN");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!attachment) {
      setAttachmentPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(attachment);
    setAttachmentPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [attachment]);

  const setField = (name: keyof typeof initialFormData, value: string) => {
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const requiredFields = [
      formData.request_type,
      formData.vehicle_nature,
      formData.number_of_persons,
      formData.travel_date_from,
      formData.travel_date_to,
      formData.required_time_from,
      formData.required_time_to,
      formData.purpose,
      formData.distance_type,
      approverType,
    ];

    if (requiredFields.some((field) => !field)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const body = new FormData();
      body.set("path_type", approverType === "DEAN" ? "via_dean" : "skip_dean");
      body.set("request_type", formData.request_type);
      body.set("vehicle_nature", formData.vehicle_nature);
      body.set("number_of_persons", formData.number_of_persons);
      body.set("travel_date_from", formData.travel_date_from);
      body.set("travel_date_to", formData.travel_date_to);
      body.set("required_time_from", formData.required_time_from);
      body.set("required_time_to", formData.required_time_to);
      body.set("purpose", formData.purpose);
      body.set("distance_type", formData.distance_type);
      body.set("places_to_visit", formData.places_to_visit);
      body.set("travel_route", formData.travel_route);
      body.set("special_notes", formData.special_notes);

      if (attachment) {
        body.set("request_letter", attachment);
      }

      const response = await fetch("/api/vehicle-requests", {
        method: "POST",
        body,
      });
      const resPayload = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(resPayload?.error ?? "Could not submit reservation request");
        return;
      }

      toast.success("Vehicle request saved to database");
      setFormData(initialFormData);
      setAttachment(null);
      setApproverType("DEAN");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setAttachment(null);
    setApproverType("DEAN");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">University Vehicle Reservation Form</h1>
      </div>

      <Card className="border border-gray-300 shadow-sm bg-white">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="border-b-2 border-gray-300 p-6 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded">
                  <Car className="w-6 h-6 text-orange-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Vehicle Request Details</h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Fields match the current vehicle_request database table.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-b border-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700 uppercase">
                    Request Type <span className="text-red-600">*</span>
                  </Label>
                  <Select value={formData.request_type} onValueChange={(value: string) => setField("request_type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white opacity-100 backdrop-blur-none border border-gray-200 shadow-xl">
                      <SelectItem value="official" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        Official
                      </SelectItem>
                      <SelectItem value="academic" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        Academic
                      </SelectItem>
                      <SelectItem value="field_visit" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        Field Visit
                      </SelectItem>
                      <SelectItem value="other" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700 uppercase">
                    Vehicle Nature <span className="text-red-600">*</span>
                  </Label>
                  <Select value={formData.vehicle_nature} onValueChange={(value: string) => setField("vehicle_nature", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white opacity-100 backdrop-blur-none border border-gray-200 shadow-xl">
                      <SelectItem value="university_owned" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        University Owned
                      </SelectItem>
                      <SelectItem value="hired" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        Hired
                      </SelectItem>
                      <SelectItem value="any_available" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        Any Available
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="number_of_persons" className="text-xs font-semibold text-gray-700 uppercase">
                    Number of Persons <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="number_of_persons"
                    type="number"
                    min="1"
                    value={formData.number_of_persons}
                    onChange={(event) => setField("number_of_persons", event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700 uppercase">
                    Trip Type <span className="text-red-600">*</span>
                  </Label>
                  <Select value={formData.distance_type} onValueChange={(value: string) => setField("distance_type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white opacity-100 backdrop-blur-none border border-gray-200 shadow-xl">
                      <SelectItem value="short" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        Short Trip
                      </SelectItem>
                      <SelectItem value="long" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        Long Trip
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="travel_date_from" className="text-xs font-semibold text-gray-700 uppercase">
                    Travel Date From <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="travel_date_from"
                    type="date"
                    value={formData.travel_date_from}
                    onChange={(event) => setField("travel_date_from", event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="travel_date_to" className="text-xs font-semibold text-gray-700 uppercase">
                    Travel Date To <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="travel_date_to"
                    type="date"
                    value={formData.travel_date_to}
                    onChange={(event) => setField("travel_date_to", event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="required_time_from" className="text-xs font-semibold text-gray-700 uppercase">
                    Required Time From <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="required_time_from"
                    type="time"
                    value={formData.required_time_from}
                    onChange={(event) => setField("required_time_from", event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="required_time_to" className="text-xs font-semibold text-gray-700 uppercase">
                    Required Time To <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="required_time_to"
                    type="time"
                    value={formData.required_time_to}
                    onChange={(event) => setField("required_time_to", event.target.value)}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="purpose" className="text-xs font-semibold text-gray-700 uppercase">
                    Purpose <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(event) => setField("purpose", event.target.value)}
                    className="min-h-20 resize-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="places_to_visit" className="text-xs font-semibold text-gray-700 uppercase">
                    Places to Visit
                  </Label>
                  <Textarea
                    id="places_to_visit"
                    value={formData.places_to_visit}
                    onChange={(event) => setField("places_to_visit", event.target.value)}
                    className="min-h-16 resize-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="travel_route" className="text-xs font-semibold text-gray-700 uppercase">
                    Travel Route
                  </Label>
                  <Textarea
                    id="travel_route"
                    value={formData.travel_route}
                    onChange={(event) => setField("travel_route", event.target.value)}
                    className="min-h-16 resize-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="special_notes" className="text-xs font-semibold text-gray-700 uppercase">
                    Special Notes
                  </Label>
                  <Textarea
                    id="special_notes"
                    value={formData.special_notes}
                    onChange={(event) => setField("special_notes", event.target.value)}
                    className="min-h-16 resize-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase">
                    Send Request To <span className="text-red-600">*</span>
                  </Label>
                  <Select value={approverType} onValueChange={(v: string) => setApproverType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEAN">Dean</SelectItem>
                      <SelectItem value="UDR">University Deputy Registrar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t-2 border-gray-300">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                    Attach File
                    <input
                      type="file"
                      accept={ACCEPTED_FILE_TYPES.join(",")}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (!file) {
                          setAttachment(null);
                          return;
                        }
                        if (file.size > MAX_FILE_SIZE_BYTES) {
                          toast.error("File size must be under 2MB");
                          e.target.value = "";
                          return;
                        }
                        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
                          toast.error("Only PNG, JPG, or PDF files are allowed");
                          e.target.value = "";
                          return;
                        }
                        setAttachment(file);
                      }}
                    />
                  </label>

                  {attachmentPreviewUrl && attachment ? (
                    <a
                      href={attachmentPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-orange-600 underline underline-offset-4 hover:text-orange-700"
                    >
                      Open attached file: {attachment.name}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">No attachment selected</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="border-gray-400 text-gray-700 hover:bg-gray-100"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Form
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
