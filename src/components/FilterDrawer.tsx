import React, { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const ALL_COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Ethiopia", "Egypt", "Morocco",
  "Tanzania", "Uganda", "DR Congo", "Cameroon", "Ivory Coast", "Senegal",
  "Zimbabwe", "Rwanda", "Angola", "Mali", "Burkina Faso", "Niger", "Guinea",
  "Algeria", "Tunisia", "Libya", "Botswana", "Namibia", "Zambia", "Malawi",
  "USA", "Canada", "Brazil", "Mexico", "Jamaica", "Haiti", "Colombia", "Argentina",
  "Dominican Republic", "Trinidad and Tobago", "Venezuela", "Peru", "Chile", "Ecuador",
  "United Kingdom", "France", "Germany", "Italy", "Spain", "Netherlands", "Belgium",
  "Portugal", "Sweden", "Switzerland", "Ireland", "Poland", "Norway", "Denmark", "Austria",
  "UAE", "Saudi Arabia", "Qatar", "Kuwait", "Turkey", "Lebanon", "Jordan", "Oman",
  "India", "China", "Japan", "South Korea", "Singapore", "Malaysia", "Thailand", "Philippines",
  "Australia", "New Zealand",
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

const RELIGIONS = [
  { value: "christianity", label: "Christianity" },
  { value: "islam", label: "Islam" },
  { value: "traditional_african", label: "Traditional African" },
  { value: "spiritual", label: "Spiritual" },
  { value: "agnostic", label: "Agnostic" },
  { value: "prefer_not_say", label: "Any" },
];

const RELATIONSHIP_GOALS = [
  { value: "dating", label: "Dating" },
  { value: "serious_relationship", label: "Serious Relationship" },
  { value: "marriage", label: "Marriage" },
  { value: "friendship", label: "Friendship" },
];

const EDUCATION_LEVELS = [
  { value: "high_school", label: "High School" },
  { value: "some_college", label: "Some College" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate" },
];

const LANGUAGES = [
  "English", "French", "Arabic", "Swahili", "Yoruba",
  "Igbo", "Hausa", "Amharic", "Zulu", "Portuguese", "Spanish",
  "Lingala", "Wolof", "Somali", "Berber", "Oromo",
];

const CULTURAL_VALUES = [
  "Family-Oriented", "Community-Focused", "Respect for Elders", "Spirituality",
  "Hospitality", "Resilience", "Tradition", "Innovation", "Generosity",
  "Polygamy", "Monogamy", "Prefer Not Say",
];

const INTERESTS = [
  "Music", "Dance", "Art", "Cuisine", "Travel", "Sports", "Reading",
  "Movies", "Nature", "Technology", "Fashion", "History", "Politics",
  "Volunteering", "Photography", "Gaming", "Fitness", "Writing", "Animals",
];

const PREFERRED_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
];

export interface Filters {
  age_min: number;
  age_max: number;
  distance_km: number;
  countries_of_origin: string[];
  states: string[];
  religions: string[];
  relationship_goals: string[];
  education_levels: string[];
  cultural_values: string[];
  interests: string[];
  languages?: string[];
  preferred_language: string;
  verified_only: boolean;
  height_min?: number;
  height_max?: number;
  smoking?: string[];
  drinking?: string[];
  fitness?: string[];
}

const DEFAULT_FILTERS: Filters = {
  age_min: 18,
  age_max: 50,
  distance_km: 100,
  countries_of_origin: [],
  states: [],
  religions: [],
  relationship_goals: [],
  education_levels: [],
  cultural_values: [],
  interests: [],
  preferred_language: "",
  verified_only: false,
};

interface FilterDrawerProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isPremium?: boolean;
  userTier?: string;
}

export default function FilterDrawer({ filters, onFiltersChange, isPremium = false }: FilterDrawerProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters || DEFAULT_FILTERS);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedFilters = useDebounce(localFilters, 500);

  React.useEffect(() => {
    if (JSON.stringify(debouncedFilters) !== JSON.stringify(filters)) {
      onFiltersChange(debouncedFilters);
    }
  }, [debouncedFilters, filters, onFiltersChange]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: keyof Filters, item: string) => {
    setLocalFilters((prev) => {
      const arr = (prev[key] as string[]) || [];
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item],
      };
    });
  };

  const applyFilters = async () => {
    onFiltersChange(localFilters);
    // TODO: Save filters to user profile via Supabase
    setIsOpen(false);
  };

  const resetFilters = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  const activeFiltersCount = [
    localFilters.countries_of_origin?.length > 0,
    localFilters.states?.length > 0,
    localFilters.religions?.length > 0,
    localFilters.relationship_goals?.length > 0,
    localFilters.education_levels?.length > 0,
    localFilters.cultural_values?.length > 0,
    localFilters.interests?.length > 0,
    localFilters.preferred_language !== "",
    localFilters.age_min !== 18 || localFilters.age_max !== 50,
    localFilters.distance_km !== 100,
    localFilters.verified_only,
  ].filter(Boolean).length;

  const renderBadgeGroup = (items: string[], filterKey: keyof Filters, premium = false) => (
    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
      {items.map((item) => (
        <Badge
          key={item}
          variant={(localFilters[filterKey] as string[])?.includes(item) ? "default" : "outline"}
          className={`cursor-pointer transition ${
            (localFilters[filterKey] as string[])?.includes(item)
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          } ${premium && !isPremium ? "opacity-50" : ""}`}
          onClick={() => {
            if (premium && !isPremium) {
              alert("Upgrade to Premium for this filter");
              return;
            }
            toggleArrayItem(filterKey, item);
          }}
        >
          {item}
        </Badge>
      ))}
    </div>
  );

  const renderCheckboxGroup = (items: { value: string; label: string }[], filterKey: keyof Filters, premium = false) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.value} className="flex items-center space-x-3">
          <Checkbox
            id={item.value}
            checked={(localFilters[filterKey] as string[])?.includes(item.value)}
            onCheckedChange={() => (!premium || isPremium) && toggleArrayItem(filterKey, item.value)}
            disabled={premium && !isPremium}
          />
          <label htmlFor={item.value} className={`text-sm cursor-pointer ${premium && !isPremium ? "opacity-50" : ""}`}>
            {item.label}
          </label>
        </div>
      ))}
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative gap-2">
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Filters</SheetTitle>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
              <RotateCcw size={16} className="mr-1" />
              Reset
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] px-6 py-4">
          <div className="space-y-8">
            {/* Age Range */}
            <div>
              <Label className="text-sm font-semibold mb-4 block">
                Age Range: {localFilters.age_min} - {localFilters.age_max}
              </Label>
              <div className="pt-2 px-2">
                <Slider
                  min={18} max={70} step={1}
                  value={[localFilters.age_min, localFilters.age_max]}
                  onValueChange={([min, max]) => {
                    updateFilter("age_min", min);
                    updateFilter("age_max", max);
                  }}
                />
              </div>
            </div>

            {/* Distance */}
            <div>
              <Label className="text-sm font-semibold mb-4 block">
                Distance: {localFilters.distance_km === 500 ? "Global" : `${localFilters.distance_km} km`}
              </Label>
              <div className="pt-2 px-2">
                <Slider
                  min={10} max={500} step={10}
                  value={[localFilters.distance_km]}
                  onValueChange={([val]) => updateFilter("distance_km", val)}
                />
              </div>
            </div>

            {/* Countries */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                Heritage Country
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              {renderBadgeGroup(ALL_COUNTRIES, "countries_of_origin", true)}
            </div>

            {/* US States */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                US State
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              {renderBadgeGroup(US_STATES, "states", true)}
            </div>

            {/* Relationship Goals */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Looking For</Label>
              {renderCheckboxGroup(RELATIONSHIP_GOALS, "relationship_goals")}
            </div>

            {/* Religion */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Religion</Label>
              {renderCheckboxGroup(RELIGIONS, "religions")}
            </div>

            {/* Education */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                Education Level
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              {renderCheckboxGroup(EDUCATION_LEVELS, "education_levels", true)}
            </div>

            {/* Height */}
            <div>
              <Label className="text-sm font-semibold mb-4 block">
                Height: {localFilters.height_min || 140} - {localFilters.height_max || 220} cm
              </Label>
              <div className="pt-2 px-2">
                <Slider
                  min={140} max={220} step={5}
                  value={[localFilters.height_min || 140, localFilters.height_max || 220]}
                  onValueChange={([min, max]) => {
                    updateFilter("height_min", min);
                    updateFilter("height_max", max);
                  }}
                />
              </div>
            </div>

            {/* Languages */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Languages Spoken</Label>
              {renderBadgeGroup(LANGUAGES, "languages")}
            </div>

            {/* Lifestyle */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Lifestyle</Label>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Smoking</Label>
                  <div className="flex flex-wrap gap-2">
                    {["never", "sometimes", "regularly"].map((option) => (
                      <Badge
                        key={option}
                        variant={(localFilters.smoking as string[])?.includes(option) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem("smoking", option)}
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Drinking</Label>
                  <div className="flex flex-wrap gap-2">
                    {["never", "socially", "regularly"].map((option) => (
                      <Badge
                        key={option}
                        variant={(localFilters.drinking as string[])?.includes(option) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem("drinking", option)}
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Fitness</Label>
                  <div className="flex flex-wrap gap-2">
                    {["never", "sometimes", "active", "very_active"].map((option) => (
                      <Badge
                        key={option}
                        variant={(localFilters.fitness as string[])?.includes(option) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem("fitness", option)}
                      >
                        {option.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cultural Values */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                Cultural Values
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              {renderBadgeGroup(CULTURAL_VALUES, "cultural_values", true)}
            </div>

            {/* Interests */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                Interests
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              {renderBadgeGroup(INTERESTS, "interests", true)}
            </div>

            {/* Preferred Language */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                Preferred Language
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              <div className="flex flex-wrap gap-2">
                {PREFERRED_LANGUAGES.map((lang) => (
                  <Badge
                    key={lang.value}
                    variant={localFilters.preferred_language === lang.value ? "default" : "outline"}
                    className={`cursor-pointer transition ${
                      localFilters.preferred_language === lang.value
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    } ${!isPremium ? "opacity-50" : ""}`}
                    onClick={() => {
                      if (!isPremium) {
                        alert("Upgrade to Premium for this filter");
                        return;
                      }
                      updateFilter("preferred_language", localFilters.preferred_language === lang.value ? "" : lang.value);
                    }}
                  >
                    {lang.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Verified Only */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Verified Profiles Only</Label>
                  <p className="text-xs text-muted-foreground mt-1">Show only photo-verified users</p>
                </div>
                <Checkbox
                  checked={localFilters.verified_only}
                  onCheckedChange={(checked) => updateFilter("verified_only", !!checked)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
