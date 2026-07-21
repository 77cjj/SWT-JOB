package com.nageoffer.ai.ragent.jobintel.service;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.jobintel.controller.request.JobIntelContributionReviewRequest;
import com.nageoffer.ai.ragent.jobintel.controller.request.JobIntelContributionSubmitRequest;
import com.nageoffer.ai.ragent.jobintel.controller.request.JobIntelDocumentReviewRequest;
import com.nageoffer.ai.ragent.jobintel.controller.request.JobIntelDocumentSubmitRequest;
import com.nageoffer.ai.ragent.jobintel.controller.vo.JobIntelContributionVO;
import com.nageoffer.ai.ragent.jobintel.controller.vo.JobIntelDocumentVO;
import com.nageoffer.ai.ragent.jobintel.dao.entity.JobIntelContributionDO;
import com.nageoffer.ai.ragent.jobintel.dao.entity.JobIntelDocumentDO;
import com.nageoffer.ai.ragent.jobintel.dao.mapper.JobIntelContributionMapper;
import com.nageoffer.ai.ragent.jobintel.dao.mapper.JobIntelDocumentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobIntelService {

    private final JobIntelContributionMapper contributionMapper;
    private final JobIntelDocumentMapper documentMapper;

    @Transactional
    public String submitContribution(String userId, JobIntelContributionSubmitRequest req) {
        String notes = StrUtil.trim(req.getNotes());
        Assert.notBlank(notes, () -> new ClientException("请填写情报内容"));
        Assert.isTrue(notes.length() >= 10, () -> new ClientException("情报内容至少 10 字"));

        JobIntelContributionDO row = JobIntelContributionDO.builder()
                .jobId(StrUtil.trimToNull(req.getJobId()))
                .submitterId(userId)
                .stateCode(StrUtil.trimToNull(req.getState()))
                .jobTitle(StrUtil.trimToNull(req.getJobTitle()))
                .hourlyWage(req.getHourlyWage() != null ? BigDecimal.valueOf(req.getHourlyWage()) : null)
                .notes(notes)
                .status("pending")
                .published(0)
                .build();
        contributionMapper.insert(row);
        return row.getId();
    }

    public List<JobIntelContributionVO> listContributionsAdmin(String status) {
        var q = Wrappers.lambdaQuery(JobIntelContributionDO.class)
                .eq(JobIntelContributionDO::getDeleted, 0)
                .orderByDesc(JobIntelContributionDO::getCreateTime);
        if (StrUtil.isNotBlank(status)) {
            q.eq(JobIntelContributionDO::getStatus, status.trim());
        }
        return contributionMapper.selectList(q).stream().map(this::toContributionVO).toList();
    }

    @Transactional
    public void reviewContribution(String id, JobIntelContributionReviewRequest req) {
        JobIntelContributionDO row = contributionMapper.selectById(id);
        Assert.notNull(row, () -> new ClientException("记录不存在"));
        if (req.getStatus() != null) {
            row.setStatus(req.getStatus().trim());
        }
        if (req.getAdminSummary() != null) {
            row.setAdminSummary(StrUtil.trimToNull(req.getAdminSummary()));
        }
        if (req.getPublished() != null) {
            row.setPublished(req.getPublished() ? 1 : 0);
        }
        if (req.getJobId() != null) {
            row.setJobId(StrUtil.trimToNull(req.getJobId()));
        }
        contributionMapper.updateById(row);
    }

    @Transactional
    public String submitDocument(String userId, String jobId, JobIntelDocumentSubmitRequest req) {
        Assert.notBlank(jobId, () -> new ClientException("岗位 ID 无效"));
        String kind = StrUtil.trimToNull(req.getKind());
        Assert.isTrue("job_rules".equals(kind) || "employer_posting".equals(kind),
                () -> new ClientException("类型无效"));
        String body = StrUtil.trim(req.getBody());
        Assert.notBlank(body, () -> new ClientException("内容不能为空"));
        Assert.isTrue(body.length() >= 20, () -> new ClientException("内容至少 20 字"));

        JobIntelDocumentDO row = JobIntelDocumentDO.builder()
                .jobId(jobId.trim())
                .kind(kind)
                .title(StrUtil.trimToNull(req.getTitle()))
                .body(body)
                .uploaderId(userId)
                .status("pending")
                .build();
        documentMapper.insert(row);
        return row.getId();
    }

    public List<JobIntelDocumentVO> listDocumentsPublic(String jobId) {
        return documentMapper.selectList(
                Wrappers.lambdaQuery(JobIntelDocumentDO.class)
                        .eq(JobIntelDocumentDO::getJobId, jobId)
                        .eq(JobIntelDocumentDO::getStatus, "published")
                        .eq(JobIntelDocumentDO::getDeleted, 0)
                        .orderByDesc(JobIntelDocumentDO::getCreateTime)
        ).stream().map(this::toDocumentVO).toList();
    }

    public List<JobIntelDocumentVO> listDocumentsAdmin(String status) {
        var q = Wrappers.lambdaQuery(JobIntelDocumentDO.class)
                .eq(JobIntelDocumentDO::getDeleted, 0)
                .orderByDesc(JobIntelDocumentDO::getCreateTime);
        if (StrUtil.isNotBlank(status)) {
            q.eq(JobIntelDocumentDO::getStatus, status.trim());
        }
        return documentMapper.selectList(q).stream().map(this::toDocumentVO).toList();
    }

    @Transactional
    public void reviewDocument(String id, JobIntelDocumentReviewRequest req) {
        JobIntelDocumentDO row = documentMapper.selectById(id);
        Assert.notNull(row, () -> new ClientException("记录不存在"));
        if (req.getStatus() != null) {
            row.setStatus(req.getStatus().trim());
        }
        if (req.getTitle() != null) {
            row.setTitle(StrUtil.trimToNull(req.getTitle()));
        }
        if (req.getBody() != null) {
            row.setBody(StrUtil.trim(req.getBody()));
        }
        documentMapper.updateById(row);
    }

    private JobIntelContributionVO toContributionVO(JobIntelContributionDO row) {
        return JobIntelContributionVO.builder()
                .id(row.getId())
                .jobId(row.getJobId())
                .submitterId(row.getSubmitterId())
                .stateCode(row.getStateCode())
                .jobTitle(row.getJobTitle())
                .hourlyWage(row.getHourlyWage() != null ? row.getHourlyWage().doubleValue() : null)
                .notes(row.getNotes())
                .status(row.getStatus())
                .adminSummary(row.getAdminSummary())
                .published(row.getPublished() != null && row.getPublished() == 1)
                .createTime(row.getCreateTime())
                .updateTime(row.getUpdateTime())
                .build();
    }

    private JobIntelDocumentVO toDocumentVO(JobIntelDocumentDO row) {
        return JobIntelDocumentVO.builder()
                .id(row.getId())
                .jobId(row.getJobId())
                .kind(row.getKind())
                .title(row.getTitle())
                .body(row.getBody())
                .uploaderId(row.getUploaderId())
                .status(row.getStatus())
                .createTime(row.getCreateTime())
                .updateTime(row.getUpdateTime())
                .build();
    }
}
