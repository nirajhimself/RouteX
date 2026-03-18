from fastapi import APIRouter, HTTPException
from schemas import NegotiateRequest
from negotiation_agent import NegotiationAgent, ShipmentContext, Priority, CARRIER_PROFILES

router = APIRouter(prefix="", tags=["Negotiation"])


@router.post("/negotiate")
def run_negotiation(req: NegotiateRequest):
    shipment = ShipmentContext(
        weight_kg       = req.weight_kg,
        sender_city     = req.sender_city,
        receiver_city   = req.receiver_city,
        declared_value  = req.declared_value,
        tracking_number = req.tracking_number,
        booking_type    = req.booking_type,
        is_recurring    = req.is_recurring,
    )
    profile = CARRIER_PROFILES.get(req.carrier_id)
    if not profile:
        raise HTTPException(status_code=400, detail=f"Unknown carrier: {req.carrier_id}")

    target = req.target_rate if req.target_rate > 0 else round(profile["base_rate"] * 0.83, 1)

    try:
        priority = Priority(req.priority)
    except ValueError:
        priority = Priority.BALANCED

    agent  = NegotiationAgent(req.carrier_id, shipment, target, priority)
    result = agent.run()
    return result