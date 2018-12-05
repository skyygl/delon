// tslint:disable:no-any
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { InputNumber } from '@delon/util';

declare var G2: any;

@Component({
  selector: 'g2-gauge',
  template: `<div #container></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class G2GaugeComponent implements OnInit, OnDestroy, OnChanges {
  // #region fields

  @Input() title: string;
  @Input() @InputNumber() height;
  @Input() color = '#2F9CFF';
  @Input() bgColor = '#F0F2F5';
  // tslint:disable-next-line:ban-types
  @Input() format: Function;
  @Input() @InputNumber() percent: number;

  // #endregion

  @ViewChild('container') private node: ElementRef;

  private chart: any;
  private initFlag = false;

  private createData() {
    return [{ name: this.title, value: this.percent }];
  }

  private draw() {
    if (!this.chart) return;
    this.chart.guide().clear();
    const data = this.createData();
    // 绘制仪表盘背景
    this.chart.guide().arc({
      zIndex: 0,
      top: false,
      start: [0, 0.95],
      end: [100, 0.95],
      style: {
        // 底灰色
        stroke: this.bgColor,
        lineWidth: 12,
      },
    });
    // 绘制指标
    this.chart.guide().arc({
      zIndex: 1,
      start: [0, 0.95],
      end: [data[0].value, 0.95],
      style: {
        stroke: this.color,
        lineWidth: 12,
      },
    });
    // 绘制数字
    this.chart.guide().html({
      position: ['50%', '95%'],
      html: `
      <div style="width: 300px;text-align: center;font-size: 12px!important;">
        <p style="font-size: 14px; color: rgba(0,0,0,0.43);margin: 0;">${this.title}</p>
        <p style="font-size: 24px;color: rgba(0,0,0,0.85);margin: 0;">
          ${data[0].value}%
        </p>
      </div>`,
    });
    this.chart.changeData(data);
  }

  private install() {
    this.uninstall();
    this.node.nativeElement.innerHTML = '';
    const Shape = G2.Shape;
    // 自定义Shape 部分
    Shape.registerShape('point', 'pointer', {
      drawShape(cfg, group) {
        let point = cfg.points[0]; // 获取第一个标记点
        point = this.parsePoint(point);
        const center = this.parsePoint({
          // 获取极坐标系下画布中心点
          x: 0,
          y: 0,
        });
        // 绘制指针
        group.addShape('line', {
          attrs: {
            x1: center.x,
            y1: center.y,
            x2: point.x,
            y2: point.y,
            stroke: cfg.color,
            lineWidth: 2,
            lineCap: 'round',
          },
        });

        // const { origin } = cfg;
        // group.addShape('text', {
        //   attrs: {
        //     x: center.x,
        //     y: center.y + 80,
        //     text: `${origin._origin.value}%`,
        //     textAlign: 'center',
        //     fontSize: 24,
        //     fill: 'rgba(0, 0, 0, 0.85)',
        //   },
        // });
        return group.addShape('circle', {
          attrs: {
            x: center.x,
            y: center.y,
            r: 9.75,
            stroke: cfg.color,
            lineWidth: 2,
            fill: '#fff',
          },
        });
      },
    });

    const data = this.createData();
    const chart = new G2.Chart({
      container: this.node.nativeElement,
      forceFit: true,
      height: this.height,
      padding: [10, 10, 30, 10],
    });
    chart.source(data);

    chart.coord('polar', {
      startAngle: Math.PI * -1.2,
      endAngle: Math.PI * 0.2,
    });
    chart.scale('value', {
      min: 0,
      max: 100,
      nice: true,
      tickCount: 6,
    });

    chart.axis('1', false);
    // 刻度值
    chart.axis('value', {
      zIndex: 2,
      line: null,
      label: {
        offset: -12,
        formatter: this.format,
      },
      tickLine: null,
      grid: null,
    });
    chart.legend(false);
    chart
      .point({
        generatePoints: true,
      })
      .position('value*1')
      .shape('pointer')
      .color(this.color)
      .active(false);

    this.chart = chart;
    this.draw();
  }

  private uninstall() {
    if (this.chart) this.chart.destroy();
  }

  ngOnInit(): void {
    this.initFlag = true;
    this.install();
  }

  ngOnChanges(): void {
    if (this.initFlag) this.draw();
  }

  ngOnDestroy(): void {
    this.uninstall();
  }
}
