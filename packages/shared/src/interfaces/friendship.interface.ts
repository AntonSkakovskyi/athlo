import type { FriendRequestStatus } from '../enums/friend-request-status.enum.js';

export interface IFriendship {
  id: number;
  userId: number;
  friendId: number;
  status: FriendRequestStatus;
  createdAt: Date;
}
