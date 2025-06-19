namespace MetaLink.Application.Requests
{
    public class AnalizeMessageContentRequest
    {
        public string ParentMail { get; set; }
        public string ParentName { get; set; }
        public string ParentLastName { get; set; }
        public string StudentName { get; set; }
        public string StudentLastName { get; set; }
    }
}
