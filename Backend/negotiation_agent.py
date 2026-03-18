"""
RouteX AI Negotiation Agent
────────────────────────────
Pure rule-based negotiation engine. No external AI needed.
Simulates intelligent multi-round negotiation between company and carriers.
"""

import random
import math
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class NegotiationStatus(str, Enum):
    PENDING     = "pending"
    NEGOTIATING = "negotiating"
    AGREED      = "agreed"
    FAILED      = "failed"

class Priority(str, Enum):
    COST     = "cost"      # minimize price at all costs
    SPEED    = "speed"     # accept premium for faster delivery
    BALANCED = "balanced"  # balance cost and speed


# ─── Carrier profiles ─────────────────────────────────────────────────────────

CARRIER_PROFILES = {
    "delhivery": {
        "name":           "Delhivery",
        "base_rate":      45,
        "floor_rate":     32,
        "aggression":     0.6,   # how hard they push back (0=soft, 1=hard)
        "concession_rate":0.08,  # % they drop per round
        "strengths":      ["pan-india coverage", "real-time tracking", "COD support"],
        "est_days":       3,
    },
    "dtdc": {
        "name":           "DTDC",
        "base_rate":      38,
        "floor_rate":     28,
        "aggression":     0.5,
        "concession_rate":0.10,
        "strengths":      ["wide pin-code coverage", "same-day in metros", "bulk discounts"],
        "est_days":       4,
    },
    "dhl": {
        "name":           "DHL",
        "base_rate":      72,
        "floor_rate":     55,
        "aggression":     0.8,
        "concession_rate":0.05,
        "strengths":      ["premium handling", "international", "guaranteed SLA"],
        "est_days":       2,
    },
    "bluedart": {
        "name":           "Blue Dart",
        "base_rate":      65,
        "floor_rate":     50,
        "aggression":     0.75,
        "concession_rate":0.06,
        "strengths":      ["express delivery", "high-value shipments", "door-to-door"],
        "est_days":       2,
    },
    "ecom": {
        "name":           "Ecom Express",
        "base_rate":      35,
        "floor_rate":     26,
        "aggression":     0.4,
        "concession_rate":0.12,
        "strengths":      ["e-commerce focus", "reverse logistics", "competitive pricing"],
        "est_days":       4,
    },
}


# ─── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class ShipmentContext:
    weight_kg:       float
    sender_city:     str
    receiver_city:   str
    declared_value:  float = 0
    tracking_number: str   = "N/A"
    booking_type:    str   = "B2C"  # B2B gets better leverage
    is_recurring:    bool  = False


@dataclass
class NegotiationMessage:
    role:    str   # "ai" | "company" | "carrier" | "system"
    sender:  str
    content: str
    price:   Optional[float] = None
    accepted:bool = False


@dataclass
class NegotiationState:
    round:          int   = 0
    company_offer:  float = 0
    carrier_offer:  float = 0
    status:         NegotiationStatus = NegotiationStatus.NEGOTIATING
    final_rate:     Optional[float]   = None
    messages:       list  = field(default_factory=list)


# ─── Agent Brain ───────────────────────────────────────────────────────────────

class NegotiationAgent:
    """
    Multi-round negotiation agent with:
    - Dynamic opening offer based on market analysis
    - Leverage calculation (weight, B2B, recurring)
    - Carrier personality simulation
    - Adaptive counter-offer strategy
    - Walk-away logic
    """

    MAX_ROUNDS = 5

    def __init__(
        self,
        carrier_id:  str,
        shipment:    ShipmentContext,
        target_rate: float,
        priority:    Priority = Priority.BALANCED,
    ):
        profile = CARRIER_PROFILES.get(carrier_id)
        if not profile:
            raise ValueError(f"Unknown carrier: {carrier_id}")

        self.carrier      = profile
        self.shipment     = shipment
        self.target_rate  = target_rate
        self.priority     = priority
        self.state        = NegotiationState()

        # Compute leverage score 0–1
        self.leverage = self._compute_leverage()

        # Effective floor — carrier may go slightly below stated floor if leverage is high
        self.effective_floor = profile["floor_rate"] * (1 - self.leverage * 0.08)

    # ── Leverage ─────────────────────────────────────────────────────────────

    def _compute_leverage(self) -> float:
        score = 0.0
        w = self.shipment.weight_kg
        if   w > 100: score += 0.35
        elif w > 50:  score += 0.25
        elif w > 20:  score += 0.15
        elif w > 10:  score += 0.08

        if self.shipment.booking_type == "B2B": score += 0.20
        if self.shipment.is_recurring:          score += 0.15
        if self.shipment.declared_value > 50000:score += 0.10

        return min(score, 0.80)

    # ── Opening analysis message ──────────────────────────────────────────────

    def _opening_analysis(self) -> str:
        leverage_label = (
            "strong"   if self.leverage > 0.5 else
            "moderate" if self.leverage > 0.25 else
            "limited"
        )
        lines = [
            f"Analyzing shipment #{self.shipment.tracking_number}.",
            f"Route: {self.shipment.sender_city} → {self.shipment.receiver_city} | Weight: {self.shipment.weight_kg}kg | Type: {self.shipment.booking_type}.",
            f"Market rate for {self.carrier['name']}: ₹{self.carrier['base_rate']}/kg | Their floor: ~₹{self.carrier['floor_rate']}/kg.",
            f"Negotiation leverage: {leverage_label} (score: {self.leverage:.2f}).",
            f"Strategy: {'aggressive cost reduction' if self.priority == Priority.COST else 'balanced value negotiation' if self.priority == Priority.BALANCED else 'accept premium for speed'}.",
            f"Target: ₹{self.target_rate}/kg. Initiating negotiation..."
        ]
        return " ".join(lines)

    # ── Compute company opening offer ─────────────────────────────────────────

    def _company_opening_offer(self) -> float:
        # Start slightly above target to leave room
        buffer = 1.08 if self.priority == Priority.COST else 1.05
        offer = self.target_rate * buffer
        # Never open above carrier base (no reason to)
        return round(min(offer, self.carrier["base_rate"] * 0.95), 1)

    # ── Carrier counter-offer logic ───────────────────────────────────────────

    def _carrier_counter(self, company_offer: float, round_num: int) -> float:
        base    = self.carrier["base_rate"]
        floor   = self.effective_floor
        concede = self.carrier["concession_rate"]

        # Carrier starts near base, drops each round
        carrier_current = base * (1 - concede * (round_num - 1))
        carrier_current = max(carrier_current, floor)

        # If company offer is above carrier current → split difference
        if company_offer >= carrier_current:
            counter = (company_offer + carrier_current) / 2
        else:
            # Company is below carrier floor — carrier stays near floor with small nudge
            nudge   = (company_offer - floor) * 0.25 * self.leverage
            counter = floor + nudge

        return round(max(counter, floor), 1)

    # ── Company counter-offer logic ───────────────────────────────────────────

    def _company_counter(self, carrier_offer: float, round_num: int) -> float:
        gap      = carrier_offer - self.target_rate
        # Move toward carrier each round, but slower if cost priority
        step_pct = 0.25 if self.priority == Priority.COST else 0.35
        step     = gap * step_pct * (1 + self.leverage * 0.3)
        offer    = self.state.company_offer + step
        return round(min(offer, carrier_offer * 0.97), 1)

    # ── Message generators ────────────────────────────────────────────────────

    def _company_opening_message(self, offer: float) -> str:
        strength = self.carrier["strengths"][0]
        lines = [
            f"Hello {self.carrier['name']}, we have a {self.shipment.weight_kg}kg shipment from "
            f"{self.shipment.sender_city} to {self.shipment.receiver_city}.",
            f"We're aware of your {strength} and we're interested in a long-term partnership.",
        ]
        if self.shipment.booking_type == "B2B":
            lines.append("As a business account, we ship regularly and can commit to monthly volumes.")
        lines.append(f"Our opening offer is ₹{offer}/kg. We look forward to a mutually beneficial arrangement.")
        return " ".join(lines)

    def _carrier_response_message(self, counter: float, round_num: int) -> str:
        base = self.carrier["base_rate"]
        if round_num == 1:
            return (
                f"Thank you for reaching out. For a {self.shipment.weight_kg}kg shipment on this route, "
                f"our standard rate is ₹{base}/kg. Given your interest in a partnership, "
                f"we can offer ₹{counter}/kg which includes full tracking and priority handling."
            )
        elif round_num <= 3:
            pct_drop = round((base - counter) / base * 100, 1)
            return (
                f"We appreciate your continued interest. We've already reduced by {pct_drop}% from our base rate. "
                f"Our best offer at this stage is ₹{counter}/kg — this covers our operational costs on this lane."
            )
        else:
            return (
                f"This is becoming very close to our floor price. "
                f"₹{counter}/kg is near the limit of what we can sustain operationally. "
                f"We hope we can close the deal at this rate."
            )

    def _company_counter_message(self, offer: float, carrier_offer: float, round_num: int) -> str:
        diff = round(carrier_offer - offer, 1)
        tactics = []
        if self.leverage > 0.4:
            tactics.append("Given our shipment volumes and recurring business potential")
        if self.shipment.booking_type == "B2B":
            tactics.append("As a B2B account with monthly commitments")
        if self.priority == Priority.COST:
            tactics.append("We have competing quotes from other carriers")

        tactic = tactics[0] if tactics else "Considering the market rates"

        return (
            f"{tactic}, we'd like to propose ₹{offer}/kg. "
            f"We're only ₹{diff}/kg apart — let's find a middle ground. "
            f"We're ready to commit to this carrier for this route going forward."
        )

    def _acceptance_message(self, rate: float) -> str:
        savings = round((self.carrier["base_rate"] - rate) * self.shipment.weight_kg, 2)
        return (
            f"We're pleased to accept ₹{rate}/kg. "
            f"Please proceed with the booking confirmation. "
            f"We look forward to a strong partnership with {self.carrier['name']}."
        )

    def _carrier_acceptance_message(self, rate: float) -> str:
        return (
            f"Agreed! ₹{rate}/kg confirmed. "
            f"We'll send the booking details and pickup schedule shortly. "
            f"Thank you for choosing {self.carrier['name']} — estimated delivery in {self.carrier['est_days']} days."
        )

    def _ai_summary_success(self, rate: float) -> str:
        market  = self.carrier["base_rate"]
        savings = round((market - rate) * self.shipment.weight_kg, 2)
        pct     = round((market - rate) / market * 100, 1)
        return (
            f"✅ Negotiation successful! Final rate: ₹{rate}/kg "
            f"({pct}% below market). "
            f"Total savings on this shipment: ₹{savings}. "
            f"Estimated delivery: {self.carrier['est_days']} days."
        )

    def _ai_summary_failure(self) -> str:
        alternatives = [
            c["name"] for cid, c in CARRIER_PROFILES.items()
            if c["floor_rate"] <= self.target_rate and cid != list(
                k for k, v in CARRIER_PROFILES.items() if v["name"] == self.carrier["name"]
            )[0]
        ]
        alt_text = f" Recommend trying: {', '.join(alternatives[:2])}." if alternatives else ""
        return (
            f"❌ Negotiation unsuccessful. {self.carrier['name']} could not meet our target of ₹{self.target_rate}/kg."
            f"{alt_text}"
        )

    def _should_accept(self, carrier_offer: float) -> bool:
        tolerance = (
            0.10 if self.priority == Priority.SPEED    else
            0.05 if self.priority == Priority.COST     else
            0.08
        )
        return carrier_offer <= self.target_rate * (1 + tolerance)

    # ── Main run ──────────────────────────────────────────────────────────────

    def run(self) -> dict:
        """
        Run the full negotiation. Returns a dict with all messages and result.
        """
        msgs = self.state.messages

        def add(role, sender, content, price=None, accepted=False):
            msgs.append({
                "role":     role,
                "sender":   sender,
                "content":  content,
                "price":    price,
                "accepted": accepted,
            })

        carrier_name = self.carrier["name"]

        # ── 1. AI opens with analysis ────────────────────────────────────────
        add("system", "System",
            f"Negotiation session started · {carrier_name} · {self.shipment.weight_kg}kg")
        add("ai", "RouteX AI", self._opening_analysis())

        # ── 2. Company opening offer ─────────────────────────────────────────
        opening = self._company_opening_offer()
        self.state.company_offer = opening
        add("company", "RouteX (Company)", self._company_opening_message(opening), price=opening)

        # ── 3. Rounds ────────────────────────────────────────────────────────
        for round_num in range(1, self.MAX_ROUNDS + 1):
            self.state.round = round_num

            # Carrier counter
            carrier_offer = self._carrier_counter(self.state.company_offer, round_num)
            self.state.carrier_offer = carrier_offer
            add("carrier", carrier_name,
                self._carrier_response_message(carrier_offer, round_num),
                price=carrier_offer)

            # Should company accept carrier offer?
            if self._should_accept(carrier_offer):
                add("company", "RouteX (Company)",
                    self._acceptance_message(carrier_offer),
                    price=carrier_offer, accepted=True)
                add("carrier", carrier_name,
                    self._carrier_acceptance_message(carrier_offer))
                add("ai", "RouteX AI", self._ai_summary_success(carrier_offer))
                self.state.status     = NegotiationStatus.AGREED
                self.state.final_rate = carrier_offer
                break

            # Last round — take or leave
            if round_num == self.MAX_ROUNDS:
                # Final company push
                final_offer = round(self.target_rate * 1.02, 1)
                add("company", "RouteX (Company)",
                    f"This is our final offer: ₹{final_offer}/kg. "
                    f"We've negotiated in good faith and believe this is fair for both sides.",
                    price=final_offer)

                # Carrier decision: accept if final_offer > effective_floor + small margin
                if final_offer >= self.effective_floor * 1.03:
                    agreed_rate = round((final_offer + carrier_offer) / 2, 1)
                    add("carrier", carrier_name,
                        f"After consideration, we can meet at ₹{agreed_rate}/kg as our final position. Deal confirmed.",
                        price=agreed_rate, accepted=True)
                    add("ai", "RouteX AI", self._ai_summary_success(agreed_rate))
                    self.state.status     = NegotiationStatus.AGREED
                    self.state.final_rate = agreed_rate
                else:
                    add("carrier", carrier_name,
                        f"We're unable to go below ₹{carrier_offer}/kg on this route. "
                        f"Our operational costs don't allow further reduction at this time.")
                    add("ai", "RouteX AI", self._ai_summary_failure())
                    self.state.status = NegotiationStatus.FAILED
                break

            # Company counter for next round
            new_offer = self._company_counter(carrier_offer, round_num)
            self.state.company_offer = new_offer
            add("company", "RouteX (Company)",
                self._company_counter_message(new_offer, carrier_offer, round_num),
                price=new_offer)

        # ── Result ───────────────────────────────────────────────────────────
        market_rate = self.carrier["base_rate"]
        final_rate  = self.state.final_rate
        savings     = round((market_rate - final_rate) * self.shipment.weight_kg, 2) if final_rate else 0

        return {
            "status":      self.state.status,
            "final_rate":  final_rate,
            "market_rate": market_rate,
            "target_rate": self.target_rate,
            "savings":     savings,
            "rounds":      self.state.round,
            "leverage":    round(self.leverage, 2),
            "messages":    msgs,
            "carrier":     carrier_name,
            "est_days":    self.carrier["est_days"],
        }