import React from "react";
import AccountingClient from "./AccountingClient";
import { fetchAll } from "../actions";
import { AccountingMovement } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminAccountingPage() {
  const initialData = await fetchAll<AccountingMovement>("accounting_movements");
  
  return (
    <AccountingClient initialData={initialData} />
  );
}
