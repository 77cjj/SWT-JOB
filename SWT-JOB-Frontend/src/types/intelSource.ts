/** 岗位情报信息来源与贡献者（可扩展：审核、编辑、验证等角色） */
export type IntelSourceKind = 'official' | 'community';

export type IntelContributorRole = 'primary' | 'verifier' | 'editor';

export type IntelContributor = {
  userId: string;
  contributedAt: string;
  role?: IntelContributorRole;
};

export type JobIntelSource = {
  kind: IntelSourceKind;
  /** 官方来源时的展示名（默认走 demo 官方账号） */
  officialLabel?: string;
  contributors: IntelContributor[];
};
