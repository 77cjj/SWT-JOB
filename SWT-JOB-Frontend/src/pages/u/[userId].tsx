import { useRouter } from 'next/router';
import { Box, Container, Paper, Typography } from '@mui/material';
import DesktopLayout from '../../layout/desktop/Layout';
import MobileLayout from '../../layout/mobile/Layout';
import useDevice from '../../hooks/useDevice';
import { getDemoMember } from '../../lib/member/demoUsers';
import { MemberTrustCardBody } from '../../components/member/MemberTrustCard';
import { DEMO_DOC_COMMENTS } from '../../lib/docs/comments/demoComments';

export default function UserProfilePage() {
  const router = useRouter();
  const isMobile = useDevice();
  const userId = typeof router.query.userId === 'string' ? router.query.userId : '';
  const member = userId ? getDemoMember(userId) : null;
  const userComments = member
    ? DEMO_DOC_COMMENTS.filter((c) => c.userId === member.id)
    : [];

  const content = (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {!member ? (
        <Typography color="text.secondary">未找到该用户（示例档案仅包含演示账号）。</Typography>
      ) : (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <MemberTrustCardBody member={member} />
          {userComments.length > 0 ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                近期公开贡献
              </Typography>
              {userComments.map((c) => (
                <Typography key={c.id} variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  · {c.body}
                </Typography>
              ))}
            </Box>
          ) : null}
        </Paper>
      )}
    </Container>
  );

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-3xl">{content}</DesktopLayout>
  );
}
