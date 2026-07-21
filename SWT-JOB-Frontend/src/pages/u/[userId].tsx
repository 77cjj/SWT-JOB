import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DesktopLayout from '../../layout/desktop/Layout';
import MobileLayout from '../../layout/mobile/Layout';
import useDevice from '../../hooks/useDevice';
import { getDemoMember } from '../../lib/member/demoUsers';
import { MemberTrustCardBody } from '../../components/member/MemberTrustCard';
import { DEMO_DOC_COMMENTS } from '../../lib/docs/comments/demoComments';
import { historicalJobsData } from '../../data/historicalJobs';
import { useAuthStore } from '@/stores/authStore';

export default function UserProfilePage() {
  const router = useRouter();
  const isMobile = useDevice();
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);
  const userId = typeof router.query.userId === 'string' ? router.query.userId : '';
  const member = userId ? getDemoMember(userId) : null;

  const userComments = member
    ? DEMO_DOC_COMMENTS.filter((c) => c.userId === member.id)
    : [];

  const jobContributions = member
    ? historicalJobsData.filter((job) =>
        job.intelSource?.contributors.some((c) => c.userId === member.id),
      )
    : [];

  const content = (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {!member ? (
        <Typography color="text.secondary">未找到该用户（示例档案仅包含演示账号）。</Typography>
      ) : (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <MemberTrustCardBody member={member} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<ChatBubbleOutlineIcon />}
                component={Link}
                href={`/chat?contact=${encodeURIComponent(member.id)}`}
              >
                站内联系（AI / 私信占位）
              </Button>
              <Button
                variant="outlined"
                onClick={() => openLoginDialog('登录后可向该用户发送站内消息（正式版）')}
              >
                登录后发消息
              </Button>
            </Stack>
          </Paper>

          {jobContributions.length > 0 ? (
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                岗位情报贡献
              </Typography>
              <List dense disablePadding>
                {jobContributions.map((job) => {
                  const entry = job.intelSource?.contributors.find((c) => c.userId === member.id);
                  return (
                    <ListItem key={job.jobId} disableGutters sx={{ alignItems: 'flex-start' }}>
                      <ListItemText
                        primary={`${job.jobTitle} · ${job.state}${job.year ? ` (${job.year})` : ''}`}
                        secondary={
                          entry
                            ? `${job.intelSource?.kind === 'official' ? '官方' : '社区'} · ${entry.contributedAt}`
                            : undefined
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          ) : null}

          {userComments.length > 0 ? (
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                文档经验补充
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              {userComments.map((c) => (
                <Box key={c.id} sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {c.createdAt} · {c.docSlug}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {c.body}
                  </Typography>
                </Box>
              ))}
            </Paper>
          ) : null}
        </Stack>
      )}
    </Container>
  );

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-3xl">{content}</DesktopLayout>
  );
}
