const SlackDetailsSchema = new mongoose.Schema({
    slackId: { type: String, unique: true }, // Slack User ID
    slackAccessToken: { type: String }, // Slack OAuth Access Token
    slackRefreshToken: { type: String }, // Optional: Slack OAuth Refresh Token
    slackScopes: { type: [String] }, // OAuth scopes granted
    slackTeamId: { type: String }, // Slack Workspace (Team) ID
    slackTeamName: { type: String }, // Slack Workspace (Team) Name
    isActive: { type: Boolean, default: true }, // Slack integration status
    participants: [
      {
        slackId: { type: String }, // Participant Slack ID
        name: { type: String }, // Participant name
        email: { type: String }, // Participant email
      },
    ], // Array of participants
    authUser: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthUser', required: true }, // Link to AuthUser
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });
  
  SlackDetailsSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
  });
  
  const SlackDetails = mongoose.model('SlackDetails', SlackDetailsSchema);
  
  export default SlackDetails;
  