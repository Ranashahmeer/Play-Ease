using System.ComponentModel.DataAnnotations;

public class Login
{
    public int Id { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string Username { get; set; }  // ✅ Ensure this property exists
}
