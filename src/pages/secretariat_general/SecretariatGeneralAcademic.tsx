// src/pages/secretariat_general/SecretariatGeneralAcademic.tsx
import { useState } from "react"
import { BarChart3, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SecretariatGeneralResults } from "./SecretariatGeneralResults"
import { SecretariatGeneralRecours } from "./SecretariatGeneralRecours"
import locales from "@/lib/locales.json"

export function SecretariatGeneralAcademic() {
  const [activeTab, setActiveTab] = useState("results")

  return (
    <>
      <PageHeader
        title="Gestion Académique"
        subtitle="Suivi centralisé des résultats et des recours."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="results" className="gap-2">
            <BarChart3 className="size-4" />
            {locales.secretariat_general.results_title}
          </TabsTrigger>
          <TabsTrigger value="appeals" className="gap-2">
            <AlertCircle className="size-4" />
            {locales.secretariat_general.appeals_title}
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="results" className="space-y-6 border-none p-0 outline-none">
            <SecretariatGeneralResults />
          </TabsContent>
          <TabsContent value="appeals" className="space-y-6 border-none p-0 outline-none">
            <SecretariatGeneralRecours />
          </TabsContent>
        </div>
      </Tabs>
    </>
  )
}
