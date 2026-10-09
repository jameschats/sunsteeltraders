import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { ApiResponse } from '../models/api.model';
import { Theme } from '../models/site.model';

export interface StaffUser {
  userId: number;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  roleId?: number | null;
  roleName?: string | null;
  isActive: boolean;
  allowGoogleSignIn: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface Role {
  roleId: number;
  name: string;
  description?: string | null;
  permissions: string[];
}

export interface LeadRow {
  leadId: number; reference: string; type: string; status: string; channel: string; name: string; company?: string | null;
  phone: string; city?: string | null; itemCount: number; totalKg?: number | null; fileCount: number; createdAt: string;
}
export interface LeadItem { gradeText: string; form: string; dimsText: string; lengthMm?: number | null; quantity: number; kg?: number | null; cutToSize: boolean }
export interface LeadDetail extends Omit<LeadRow, 'itemCount' | 'fileCount'> {
  gstin?: string | null; email?: string | null; industry?: string | null; message?: string | null; callbackAt?: string | null; sourcePage?: string | null;
  items: LeadItem[]; files: { leadFileId: number; fileName: string; contentType: string; sizeBytes: number }[];
  notes: { leadNoteId: number; note: string; by?: string | null; createdAt: string }[];
}
export interface Paged<T> { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number }
export interface ProductRow { productId: number; slug: string; sku: string; siloKey: string; name: string; grade: string; stockStatus: string; priceNote?: string | null; isPublished: boolean; updatedAt?: string | null }
export interface Dashboard {
  newLeads: number; leadsThisWeek: number; quotedOpen: number; kgRequestedThisWeek: number; whatsAppClicks7d: number; callClicks7d: number;
  limitedOrOnOrder: number; recent: { leadId: number; reference: string; type: string; status: string; name: string; city?: string | null; totalKg?: number | null; createdAt: string }[];
}

/** Admin endpoints: settings, theme, staff users, leads, stock, dashboard. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin`;

  getSettings(): Observable<Record<string, string | null>> {
    return this.http.get<ApiResponse<Record<string, string | null>>>(`${this.base}/settings`).pipe(map((r) => r.data!));
  }

  saveSettings(settings: Record<string, string | null>): Observable<Record<string, string | null>> {
    return this.http.put<ApiResponse<Record<string, string | null>>>(`${this.base}/settings`, { settings }).pipe(map((r) => r.data!));
  }

  saveTheme(theme: Theme): Observable<Theme> {
    return this.http.put<ApiResponse<Theme>>(`${this.base}/theme`, theme).pipe(map((r) => r.data!));
  }

  users(): Observable<StaffUser[]> {
    return this.http.get<ApiResponse<StaffUser[]>>(`${this.base}/users`).pipe(map((r) => r.data ?? []));
  }

  roles(): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(`${this.base}/roles`).pipe(map((r) => r.data ?? []));
  }

  createUser(body: { email: string; fullName: string; phoneNumber: string; roleId: number; temporaryPassword: string; allowGoogleSignIn: boolean }): Observable<StaffUser> {
    return this.http.post<ApiResponse<StaffUser>>(`${this.base}/users`, body).pipe(map((r) => r.data!));
  }

  updateUser(id: number, body: { fullName: string; phoneNumber: string; roleId: number; isActive: boolean; allowGoogleSignIn: boolean }): Observable<StaffUser> {
    return this.http.put<ApiResponse<StaffUser>>(`${this.base}/users/${id}`, body).pipe(map((r) => r.data!));
  }

  dashboard(): Observable<Dashboard> {
    return this.http.get<ApiResponse<Dashboard>>(`${this.base}/dashboard`).pipe(map((r) => r.data!));
  }

  leads(q: { type?: string; status?: string; q?: string; page?: number }): Observable<Paged<LeadRow>> {
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '') params[k] = String(v);
    return this.http.get<ApiResponse<Paged<LeadRow>>>(`${this.base}/leads`, { params }).pipe(map((r) => r.data!));
  }

  lead(id: number): Observable<LeadDetail> {
    return this.http.get<ApiResponse<LeadDetail>>(`${this.base}/leads/${id}`).pipe(map((r) => r.data!));
  }

  setLeadStatus(id: number, status: string): Observable<LeadDetail> {
    return this.http.put<ApiResponse<LeadDetail>>(`${this.base}/leads/${id}/status`, { status }).pipe(map((r) => r.data!));
  }

  addLeadNote(id: number, note: string): Observable<LeadDetail> {
    return this.http.post<ApiResponse<LeadDetail>>(`${this.base}/leads/${id}/notes`, { note }).pipe(map((r) => r.data!));
  }

  leadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.base}/lead-files/${fileId}`, { responseType: 'blob' });
  }

  products(silo?: string, q?: string): Observable<Paged<ProductRow>> {
    const params: Record<string, string> = { pageSize: '100' };
    if (silo) params['silo'] = silo;
    if (q) params['q'] = q;
    return this.http.get<ApiResponse<Paged<ProductRow>>>(`${this.base}/products`, { params }).pipe(map((r) => r.data!));
  }

  setStock(id: number, stockStatus: string): Observable<void> {
    return this.http.put(`${this.base}/products/${id}/stock`, { stockStatus }).pipe(map(() => void 0));
  }

  resetPassword(id: number, temporaryPassword: string): Observable<void> {
    return this.http.post(`${this.base}/users/${id}/reset-password`, { temporaryPassword }).pipe(map(() => void 0));
  }
}
