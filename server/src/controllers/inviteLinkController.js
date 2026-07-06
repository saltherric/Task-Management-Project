const {createInviteLink, validateInviteLink, joinWorkspace} = require("../services/inviteLinkService.js");

const createInviteLinkController = async (req, res, next) => {
    try {
        const inviteLink = await createInviteLink(
            req.params.workspaceId,
            req.user._id
        );

        res.status(201).json({
            message: "Invite link created",
            link: `${process.env.CLIENT_URL}/invite/${inviteLink.token}`,
        });
    } catch (error) {
       next(error)
    }
};

const validateInviteLinkController = async (req, res, next) => {
    try {
        const invite = await validateInviteLink(req.params.token);
        res.json({
            workspace: {
                _id: invite.workspace._id,
                name: invite.workspace.name,
            },
            role: invite.role,
            expiresAt: invite.expiresAt,
        });
    } catch (error) {
        next(error);
    }
};

const joinWorkspaceController = async (req, res, next) => {
    try {
        const workspace = await joinWorkspace(
            req.params.token,
            req.user._id
        );

        res.status(200).json({
            message: "Joined workspace successfully",
            workspace: {
                _id: workspace._id,
                name: workspace.name,
            },
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    createInviteLinkController,
    validateInviteLinkController,
    joinWorkspaceController,

};