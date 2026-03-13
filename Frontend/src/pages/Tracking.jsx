import { useState, useEffect, useCallback } from 'react'
import LiveTracker from '../components/LiveTracker'
import { routeService } from '../services/routeService'
import { vehicleService } from '../services/vehicleService'
import { COMPANY_ID, POLL_INTERVAL_MS } from '../config'
import { SignalIcon, MapPinIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Spinner } from '../components/Loader'

export default function Tracking() {
  const [updateForm, setUpdateForm] = useState({ vehicle_id:'', lat:'', lng:'', speed:'' })
  const [updateStatus, setUpdateStatus] = useState('')
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({ total:0, moving:0, parked:0, idle:0, avgSpeed:0 })

  const loadStats = useCallback(async () => {
    try {
      const res = await vehicleService.getAll(COMPANY_ID)
      const list = Array.isArray(res.data) ? res.data : (res.data?.vehicles ?? res.data?.data ?? [])
      const moving = list.filter(v => (v.status||'').toLowerCase() === 'moving' || (v.status||'').toLowerCase() === 'active').length
      const parked = list.filter(v => (v.status||'').toLowerCase() === 'parked').length
      const idle   = list.filter(v => (v.status||'').toLowerCase() === 'idle').length
      const speeds = list.filter(v => v.speed > 0).map(v => v.speed)
      const avgSpeed = speeds.length ? (speeds.reduce((a,b)=>a+b,0)/speeds.length).toFixed(0) : 0
      setStats({ total:list.length, moving, parked, idle, avgSpeed })
    } catch {} finally { setStatsLoading(false) }
  }, [])

  useEffect(() => {
    loadStats()
    const id = setInterval(loadStats, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [loadStats])

  const handleLocationUpdate = async () => {
    if (!updateForm.vehicle_id || !updateForm.lat || !updateForm.lng) { setUpdateStatus('error'); return }
    setUpdateStatus('loading')
    try {
      await routeService.updateLocation({
        vehicle_id: updateForm.vehicle_id,
        latitude: Number(updateForm.lat),
        longitude: Number(updateForm.lng),
        speed: Number(updateForm.speed) || 0,
      })
      setUpdateStatus('success')
    } catch {
      setUpdateStatus('failed')
    }
    setTimeout(() => setUpdateStatus(''), 3000)
  }

  const STAT_ITEMS = [
    ['Total', statsLoading ? '…' : stats.total, '#60a5fa', SignalIcon],
    ['Moving', statsLoading ? '…' : stats.moving, '#e8001d', ArrowPathIcon],
    ['Parked', statsLoading ? '…' : stats.parked, '#4ade80', MapPinIcon],
    ['Avg Speed', statsLoading ? '…' : `${stats.avgSpeed} km/h`, '#818cf8', ClockIcon],
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Live Tracking</h1>
          <p className="section-sub">// real-time fleet telemetry · polling every {POLL_INTERVAL_MS/1000}s</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/8 border border-emerald-500/20 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[10px] text-emerald-400 tracking-wider">LIVE · {stats.total} VEHICLES</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_ITEMS.map(([l,v,c,Icon]) => (
          <div key={l} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${c}12`,border:`1px solid ${c}25`}}>
              <Icon className="w-4 h-4" style={{color:c}} />
            </div>
            <div>
              <p className="text-xl font-bold leading-none" style={{fontFamily:'Syne,sans-serif',color:c}}>{v}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{l}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Live map + vehicle list */}
      <LiveTracker />

      {/* Location push */}
      <div className="card p-5 max-w-lg">
        <h3 className="text-sm font-semibold mb-4" style={{fontFamily:'Syne,sans-serif'}}>
          Push Location Update
          <span className="ml-2 font-mono text-[9px] text-slate-600 font-normal">→ POST /update-location</span>
        </h3>
        <div className="space-y-3">
          {[['Vehicle ID','vehicle_id','text','e.g. TRK-019'],['Latitude','lat','number','e.g. 19.076'],
            ['Longitude','lng','number','e.g. 72.877'],['Speed (km/h)','speed','number','e.g. 67']
          ].map(([label,key,type,ph]) => (
            <div key={key} className="grid grid-cols-3 items-center gap-3">
              <label className="label mb-0">{label}</label>
              <input type={type} placeholder={ph} value={updateForm[key]}
                onChange={e => setUpdateForm(f=>({...f,[key]:e.target.value}))} className="input col-span-2" />
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleLocationUpdate} disabled={updateStatus==='loading'} className="btn-primary">
              {updateStatus==='loading' ? <Spinner size="sm" /> : <SignalIcon className="w-4 h-4" />}
              Push Update
            </button>
            {updateStatus==='success' && <span className="badge badge-green">✓ Location updated</span>}
            {updateStatus==='failed'  && <span className="badge badge-red">✗ Backend error</span>}
            {updateStatus==='error'   && <span className="badge badge-red">All fields required</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
