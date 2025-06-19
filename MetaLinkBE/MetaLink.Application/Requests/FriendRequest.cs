namespace MetaLink.Application.Requests
{
    public class FriendRequest
    {
        public int RequesterId { get; set; }
        public int TargetId { get; set; }
    }

    public class AcceptRequest
    {
        public int TargetId { get; set; }
    }

    public class CancelRequest
    {
        public int RequesterId { get; set; }
    }

    public class BlockFriend
    {
        public int BlockerId { get; set; }
    }

    public class DeleteFriendship
    {
        public int RequesterId { get; set; }
    }
}
