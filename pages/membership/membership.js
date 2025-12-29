// pages/membership/membership.js
const myService = require("../../services/my");
const orderPayService = require("../../services/orderPay");
const authService = require("../../services/auth");
const { navigateToH5 } = require("../../utils/h5Navigation");

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户信息
    userInfo: {
      avatar: "",
      nickname: "",
    },
    // 会员信息
    membership: {
      active: false,
      level: 1,
      levelName: "会员",
      expireDate: "",
      cardNo: "1278 3987 2979 0789",
      growthValue: 0,
      nextLevelValue: 1000,
      progressPercent: 0,
    },
    // 套餐产品列表
    products: [],
    // 选中的产品ID
    selectedProductId: null,
    // 课程列表
    courses: [],
    appInfo: {
      gzhId: null,
      wxPayAppId: null,
      zfbPayAppId: null,
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadMembershipInfo();
    this.loadPayAppInfo();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时更新用户信息
    this.loadMembershipInfo();
    this.loadPayAppInfo();
  },

  /**
   * 获取支付应用配置
   */
  async loadPayAppInfo() {
    try {
      const res = await orderPayService.getPayApp();
      if (res.success && res.data) {
        this.setData({
          appInfo: {
            ...res.data,
          },
        });
      }
    } catch (err) {
      console.error("获取支付应用配置失败:", err);
    }
  },

  /**
   * 加载会员信息
   */
  async loadMembershipInfo() {
    try {
      const res = await myService.getBenefits();
      if (res.success && res.data) {
        const { profile, membership, products } = res.data;

        // 更新用户头像和昵称
        if (profile) {
          this.setData({
            userInfo: {
              avatar: profile.avatar || "",
              nickname: profile.nickname || "会员昵称",
            },
          });
        }

        // 更新会员信息
        if (membership) {
          if (membership.active) {
            // 有效会员，映射字段
            const levelMap = {
              MONTHLY: 1,
              QUARTERLY: 2,
              ANNUAL: 3,
            };
            // 从 levelCode 提取等级（如果有的话）
            const level = levelMap[membership.levelCode] || 1;

            // 格式化到期时间 (ISO-8601 -> YYYY-MM-DD)
            let expireDate = membership.endDate || "";
            if (!expireDate && membership.endAt) {
              expireDate = membership.endAt.split("T")[0];
            }

            this.setData({
              membership: {
                ...this.data.membership,
                active: true,
                level: level,
                levelName: membership.levelName || "会员",
                expireDate: expireDate,
                remainingDays: membership.remainingDays || 0,
              },
            });
          } else {
            // 未开通会员
            this.setData({
              membership: {
                ...this.data.membership,
                active: false,
                level: 0,
                levelName: "未开通",
                expireDate: "",
                remainingDays: 0,
              },
            });
          }
        }

        // 更新套餐信息（从产品列表转换）
        if (products && products.length > 0) {
          // 转换价格从分到元，并添加显示字段
          const processedProducts = products.map((product) => ({
            ...product,
            // 价格转换（分 -> 元）
            priceYuan: (product.priceInCent / 100).toFixed(2),
            showPriceYuan: (product.show_price / 100).toFixed(2),
            renewPriceYuan: (product.renewPriceInCent / 100).toFixed(2),
          }));

          // 找到默认选中的产品ID
          const selectedProduct = processedProducts.find((p) => p.selected);
          const selectedProductId = selectedProduct
            ? selectedProduct.productId
            : processedProducts[0]?.productId || null;

          this.setData({
            products: processedProducts,
            selectedProductId: selectedProductId,
          });
        }
      }
    } catch (err) {
      console.error("加载会员信息失败:", err);
    }
  },

  /**
   * 加载课程列表
   */
  async loadCourses() {
    // TODO: 对接课程列表API
    // 使用示例数据
    this.setData({
      courses: [
        { id: 1, title: "健康养生基础课程", tag: "VIP", videoCount: 10 },
        { id: 2, title: "经络穴位入门", tag: "HOT", videoCount: 8 },
        { id: 3, title: "四季养生调理", tag: "VIP", videoCount: 12 },
      ],
    });
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack();
  },

  /**
   * 立即续费
   */
  onRenew() {
    // 跳转到支付流程
    this.onSubscribe();
  },

  /**
   * 选择套餐
   */
  onSelectPlan(e) {
    const { productId } = e.currentTarget.dataset;
    this.setData({ selectedProductId: productId });
  },

  /**
   * 立即开通/订阅
   */
  async onSubscribe() {
    const { selectedProductId, products } = this.data;
    const selectedProduct = products.find(
      (p) => p.productId === selectedProductId
    );

    if (!selectedProduct) {
      wx.showToast({
        title: "请选择套餐",
        icon: "none",
      });
      return;
    }

    wx.showModal({
      title: "确认订阅",
      content: `您选择了${selectedProduct.title}套餐，优惠价￥${selectedProduct.priceYuan}`,
      confirmText: "确认支付",
      success: async (res) => {
        if (res.confirm) {
          await this.handlePayment(selectedProduct);
        }
      },
    });
  },

  /**
   * 处理支付流程
   * @param {Object} product 选中的产品
   */
  async handlePayment(product) {
    try {
      wx.showLoading({ title: "正在创建订单..." });

      // 1. 获取用户的 openId
      const openId = await this.getUserOpenId();
      if (!openId) {
        wx.showToast({
          title: "获取用户信息失败",
          icon: "none",
        });
        return;
      }

      // 2. 调用 createAndPayOrder 创建订单并获取支付参数
      const payAppId = this.data.appInfo.wxPayAppId;
      if (!payAppId) {
        wx.showToast({
          title: "支付配置异常，请稍后重试",
          icon: "none",
        });
        return;
      }

      const paymentRequest = {
        productId: product.productId,
        quantity: 1,
        remarks: `订阅${product.title}`,
        channel: "WX_LITE", // 微信小程序支付
        openId: openId,
        payAppId: payAppId,
        orgCode: "WECHAT",
      };

      const result = await orderPayService.createAndPayOrder(paymentRequest);

      if (!result.success) {
        throw new Error(result.message || "创建订单失败");
      }

      const { payment } = result.data;

      wx.hideLoading();

      // 3. 解析 payData 并唤起微信支付
      await this.invokeWechatPay(payment);

    } catch (err) {
      wx.hideLoading();
      console.error("支付失败:", err);
      wx.showModal({
        title: "支付失败",
        content: err.message || "支付过程中出现错误，请稍后重试",
        showCancel: false,
      });
    }
  },

  /**
   * 获取用户 openId
   * @returns {Promise<string>} openId
   */
  async getUserOpenId() {
    try {
      // 调用 wx.login 获取 code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        });
      });

      if (!loginRes.code) {
        throw new Error("获取微信登录 code 失败");
      }

      // 调用 code2session 获取 openId
      const sessionRes = await authService.getUnionIdByCode(loginRes.code);
      if (!sessionRes.success || !sessionRes.data) {
        throw new Error("获取用户标识失败");
      }

      const { openId } = sessionRes.data;
      return openId;
    } catch (err) {
      console.error("获取 openId 失败:", err);
      return null;
    }
  },

  /**
   * 唤起微信支付
   * @param {Object} payment 支付信息
   */
  async invokeWechatPay(payment) {
    try {
      // 解析 payData (JSON 字符串)
      const payData = JSON.parse(payment.payData);

      // 调用微信支付
      await new Promise((resolve, reject) => {
        wx.requestPayment({
          timeStamp: payData.timeStamp,
          nonceStr: payData.nonceStr,
          package: payData.package,
          signType: payData.signType || "RSA",
          paySign: payData.paySign,
          success: resolve,
          fail: reject,
        });
      });

      // 支付成功
      wx.showToast({
        title: "支付成功",
        icon: "success",
      });

      // 延迟刷新会员信息
      setTimeout(() => {
        this.loadMembershipInfo();
      }, 1000);

    } catch (err) {
      console.error("微信支付失败:", err);

      // 用户取消支付
      if (err.errMsg && err.errMsg.includes("cancel")) {
        wx.showToast({
          title: "已取消支付",
          icon: "none",
        });
      } else {
        // 支付失败
        throw new Error(err.errMsg || "支付失败");
      }
    }
  },

  /**
   * 查看更多课程
   */
  onViewMoreCourses() {
    navigateToH5("course", {});
  },

  /**
   * 点击课程
   */
  onCourseTap(e) {
    const { id } = e.currentTarget.dataset;
    navigateToH5("course-detail", { courseId: id });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: "开通灵壹健康VIP会员，畅享健康好课",
      path: "/pages/membership/membership",
    };
  },
});
