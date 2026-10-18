import { delay, http, HttpResponse } from 'msw'
import { parseAuditLogQuery } from '../../schemas/audit'
import { db } from '../db'
import { api, authorize, paginate } from '../http-utils'

export const auditHandlers = [
  http.get(api('/audit-logs'), async ({ request }) => {
    await delay()
    const actor = authorize(request, 'audit:read')
    if (actor instanceof Response) return actor

    const query = parseAuditLogQuery(new URL(request.url).searchParams)
    const keyword = query.q.toLowerCase()
    const filtered = db.auditLogs.filter(
      (log) =>
        (query.action.length === 0 || query.action.includes(log.action)) &&
        (query.role.length === 0 || query.role.includes(log.actor.role)) &&
        (!keyword ||
          `${log.actor.name} ${log.target.label} ${log.summary}`.toLowerCase().includes(keyword)),
    )
    return HttpResponse.json(paginate(filtered, query.page, query.pageSize))
  }),
]
