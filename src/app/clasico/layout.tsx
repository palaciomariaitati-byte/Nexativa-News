import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ClassicRadioProvider } from "./ClassicRadioContext";

export default async function ClassicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();

  // Fetch radio stream URL
  const { data: settingData } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "radio_url")
    .maybeSingle();
    
  const radioUrl = settingData?.value || "https://stream.zeno.fm/gnyb99k8zzruv"; // Default fallback if missing

  return (
    <ClassicRadioProvider streamUrl={radioUrl}>
      {children}
    </ClassicRadioProvider>
  );
}
