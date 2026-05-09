"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  ShieldCheck,
  CreditCard,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- VALIDATION SCHEMA ---
const toolSchema = z.object({
  name: z.string().min(1, "Select a tool"),
  plan: z.string().min(1, "Select a plan"),
  seats: z.number().min(1, "Min 1 seat"),
  monthlySpend: z.number().min(0, "Invalid amount"),
  billingCycle: z.enum(["monthly", "annual"]),
  intensity: z.string().min(1, "Select intensity"),
  usage: z.string().min(1, "Select usage type"),
});

const formSchema = z.object({
  teamSize: z.number().min(1, "Required"),
  primaryUseCase: z.string().min(1, "Required"),
  companyStage: z.string().optional(),
  tools: z.array(toolSchema).min(1, "Add at least one tool"),
});
type FormData = z.infer<typeof formSchema>;

// --- CONSTANTS ---
const TOOL_OPTIONS = [
  "Cursor",
  "GitHub Copilot",
  "Claude",
  "ChatGPT",
  "Anthropic API",
  "OpenAI API",
  "Gemini",
  "Windsurf",
];

const PLANS: Record<string, string[]> = {
  Cursor: ["Hobby", "Pro", "Business", "Enterprise"],
  "GitHub Copilot": ["Individual", "Business", "Enterprise"],
  Claude: ["Free", "Pro", "Max", "Team", "Enterprise", "API Direct"],
  ChatGPT: ["Plus", "Team", "Enterprise", "API Direct"],
  "Anthropic API": ["API Direct"],
  "OpenAI API": ["API Direct"],
  Gemini: ["Free", "Pro", "Ultra", "API Direct"],
  Windsurf: ["Free", "Pro", "Teams"],
};

export default function AuditForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamSize: 1,
      primaryUseCase: "Coding",
      companyStage: "",
      tools: [
        {
          name: "Cursor",
          plan: "Pro",
          seats: 1,
          monthlySpend: 20,
          billingCycle: "monthly",
          intensity: "Medium",
          usage: "Coding",
        },
      ],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tools",
  });

  const watchedTools = watch("tools");

  // --- LOCAL STORAGE PERSISTENCE ---
  useEffect(() => {
    const saved = localStorage.getItem("credx_audit_form");
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach((key) => {
        setValue(key as any, parsed[key]);
      });
    }
  }, [setValue]);

  useEffect(() => {
    const subscription = watch((value) =>
      localStorage.setItem("credx_audit_form", JSON.stringify(value)),
    );
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    // Simulate API Call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Audit Data:", data);
    alert("Audit Generated! Check console for data.");
    setIsSubmitting(false);
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* PROGRESS BAR */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {["Context", "AI Stack", "Review"].map((label, i) => (
              <span
                key={label}
                className={cn(
                  "text-xs font-bold uppercase tracking-widest transition-colors",
                  step >= i + 1 ? "text-emerald-500" : "text-gray-400",
                )}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: "33%" }}
              animate={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* STEP 1: COMPANY CONTEXT */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <header>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Company Context
                  </h1>
                  <p className="text-gray-500 mt-2">
                    Tell us about your team to help us benchmark your spend.
                  </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" /> Team Size
                    </label>
                    <input
                      type="number"
                      {...register("teamSize", { valueAsNumber: true })}
                      placeholder="e.g. 12"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-400">
                      Total number of employees in your org.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Primary Use Case
                    </label>
                    <select
                      {...register("primaryUseCase")}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all"
                    >
                      {[
                        "Coding",
                        "Writing",
                        "Research",
                        "Data Analysis",
                        "Customer Support",
                        "Mixed",
                      ].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Company Stage (Optional)
                    </label>
                    <select
                      {...register("companyStage")}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all"
                    >
                      <option value="">Select Stage</option>
                      {[
                        "Solo / Freelancer",
                        "Seed (2–10)",
                        "Early (11–30)",
                        "Growth (31–100)",
                        "Scale-up (100+)",
                      ].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: AI TOOLS */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <header className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      Your AI Stack
                    </h1>
                    <p className="text-gray-500 mt-2">
                      Add the tools and subscriptions your team uses daily.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      append({
                        name: "ChatGPT",
                        plan: "Plus",
                        seats: 1,
                        monthlySpend: 20,
                        billingCycle: "monthly",
                        intensity: "Medium",
                        usage: "Mixed",
                      })
                    }
                    className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Tool
                  </button>
                </header>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={field.id}
                      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative group"
                    >
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-gray-400">
                            Tool Name
                          </label>
                          <select
                            {...register(`tools.${index}.name`)}
                            className="w-full p-2.5 rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          >
                            {TOOL_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-gray-400">
                            Current Plan
                          </label>
                          <select
                            {...register(`tools.${index}.plan`)}
                            className="w-full p-2.5 rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          >
                            {(
                              PLANS[watchedTools[index]?.name] || PLANS.Default
                            ).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-gray-400">
                            Seats
                          </label>
                          <input
                            type="number"
                            {...register(`tools.${index}.seats`, {
                              valueAsNumber: true,
                            })}
                            className="w-full p-2.5 rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-gray-400">
                            Monthly Spend
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">
                              $
                            </span>
                            <input
                              type="number"
                              {...register(`tools.${index}.monthlySpend`, {
                                valueAsNumber: true,
                              })}
                              className="w-full p-2.5 pl-7 rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-gray-400">
                            Billing Cycle
                          </label>
                          <select
                            {...register(`tools.${index}.billingCycle`)}
                            className="w-full p-2.5 rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="annual">Annual (paid yearly)</option>
                          </select>
                          <p className="text-xs text-gray-400">
                            Annual plans often save 15–20%.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-gray-400">
                            Usage Intensity
                          </label>
                          <select
                            {...register(`tools.${index}.intensity`)}
                            className="w-full p-2.5 rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          >
                            {["Light", "Medium", "Heavy"].map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-gray-400">
                            Main Usage
                          </label>
                          <select
                            {...register(`tools.${index}.usage`)}
                            className="w-full p-2.5 rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          >
                            {["Coding", "Writing", "Research", "Analysis"].map(
                              (opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: REVIEW */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <header>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Review & Analyze
                  </h1>
                  <p className="text-gray-500 mt-2">
                    Double check your inputs before we generate your audit.
                  </p>
                </header>

                <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Audit Summary
                      </p>
                      <h3 className="text-xl font-bold mt-1">
                        {watch("teamSize")} Team Members
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Total Monthly Spend
                      </p>
                      <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                        $
                        {watchedTools.reduce(
                          (acc, curr) => acc + (curr.monthlySpend || 0),
                          0,
                        )}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {watchedTools.map((tool, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs">
                            {tool.name[0]}
                          </div>
                          <div>
                            <p className="font-bold">{tool.name}</p>
                            <p className="text-gray-500 text-xs">
                              {tool.plan} • {tool.seats} seats
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">
                          ${tool.monthlySpend}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex gap-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      Privacy Guaranteed
                    </p>
                    <p className="text-sm text-emerald-700/80">
                      Your data is only used to calculate savings. We never
                      share your stack details with third parties.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NAVIGATION BUTTONS */}
          <div className="mt-12 flex items-center justify-between border-t border-gray-100 pt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={step === 2 && watchedTools.length === 0}
                className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative bg-emerald-500 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 hover:shadow-emerald-300 active:scale-95 flex items-center gap-3 overflow-hidden group"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Generate My AI Spend Audit
                    <BarChart3 className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
