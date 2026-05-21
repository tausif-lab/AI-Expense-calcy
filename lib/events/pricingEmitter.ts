import { EventEmitter } from "events";

declare global {
  var _pricingEmitter: EventEmitter | undefined;
}

if (!globalThis._pricingEmitter) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(10);
  globalThis._pricingEmitter = emitter;
}

export const pricingEmitter: EventEmitter = globalThis._pricingEmitter;

export const PRICING_CHANGED_EVENT = "pricing.changed";

export interface PricingChangedPayload {
  tool: string;
  plan: string;
  oldPrice: number;
  newPrice: number;
  updatedBy: string;
  updatedAt: Date;
}
