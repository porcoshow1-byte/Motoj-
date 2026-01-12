import React from 'react';

export type Role = 'landing' | 'user' | 'driver' | 'admin' | 'selection';

export enum ServiceType {
  MOTO_TAXI = 'MOTO_TAXI',
  DELIVERY_MOTO = 'DELIVERY_MOTO',
  DELIVERY_BIKE = 'DELIVERY_BIKE'
}

export interface Coords {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  rating: number;
  avatar: string;
}

export interface Driver {
  id: string;
  name: string;
  vehicle: string;
  plate: string;
  rating: number;
  avatar: string;
  location: Coords;
  status: 'online' | 'offline' | 'busy';
  earningsToday: number;
  phone: string;
}

export interface RideRequest {
  id: string;
  origin: string;
  destination: string;
  originCoords?: Coords;
  destinationCoords?: Coords;
  price: number;
  distance: string;
  duration: string;
  serviceType: ServiceType;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'completed';
  passenger: User;
  driver?: Driver;
  createdAt: number;
  
  // New fields for Delivery & Security
  securityCode?: string;
  deliveryDetails?: {
    type: 'send' | 'receive';
    contactName: string;
    contactPhone: string;
    instructions?: string;
  };
}

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export interface AdminStats {
  totalRides: number;
  activeDrivers: number;
  revenue: number;
  pendingApprovals: number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}